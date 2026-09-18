import { meta, getPathExtension } from "utils";
import { device, tw2, resMan } from "global";
import { CjsDdsFormat } from "@carbonenginejs/runtime/resource/formats/dds";
import { Tw2TextureRes } from "./Tw2TextureRes";
import { Tw2TextureArrayRes } from "./Tw2TextureArrayRes";
import {
    ErrResourceFormatInvalid,
    ErrResourceFormatUnsupported
} from "./Tw2Resource";
import { TextureFormatDDS } from "./formats/TextureFormatDDS";


/**
 * One RG or RGBA texture assembled from ordered single-channel sources,
 * addressed as `dynamic:/texturepack/<source0>;<source1>[;...]`.
 *
 * This is the other half of the texture-array contract, and it exists because
 * merging is not one idea. An ARRAY carries the same kind of data in several
 * images, told apart by layer - the detail maps, which are sampled at different
 * scales and cannot share a texel. A PACK carries different kinds of scalar
 * data at one coordinate, each read for a single channel, and four of those
 * are one texel.
 *
 * PMDG is the case that made it necessary, and it is a restoration rather than
 * an invention: `PaintMaskMap`, `MaterialMap`, `DirtMap` and `GlowMap` were one
 * texture until CCP separated them, and the acronym is that texture's channel
 * order. Packing them puts back what the split took apart - one fetch for four
 * scalars instead of four fetches, and one unit instead of four.
 *
 * Measured on the emitted GLSL rather than assumed: every read of the merged
 * binding takes exactly one channel (`.x`, `.y`, `.z`, `.w`), which is the
 * premise the whole transform rests on. The emitter refuses any use it cannot
 * redirect at a channel, so a member read for more than its scalar fails the
 * build instead of arriving wrong.
 *
 * ## Which channel of the source
 *
 * RED. The sources are scalar maps whose STORAGE is not single-channel - the
 * research on Frontier's material family found them shipped as DXT1 with the
 * value replicated across RGB, and as BC4 with it in red alone. Red is the one
 * component both spellings agree on.
 *
 * ## Width follows the member count
 *
 * Two members are RG8, three or four are RGBA8. This is not tidiness: a pair
 * packed into RGBA8 would cost four bytes a texel to carry two, which is more
 * than the two compressed sources cost separately - so packing a pair would buy
 * one texture unit and pay for it in memory. At RG8 a pair costs what a
 * two-layer array would and still reads in one fetch.
 *
 * Three members take RGBA8 rather than RGB8: three-channel textures are padded
 * to four by most drivers anyway, and RGB8 is not colour-renderable, so the
 * narrower format would cost the same and constrain later use.
 *
 * ## Size
 *
 * Up, to the largest source. Unlike the array case there is little to weigh it
 * against: the aggregate is one texture of a fixed width whatever it is built
 * from, so going down would discard detail without buying the width back.
 */
@meta.define("Tw2TexturePackRes")
export class Tw2TexturePackRes extends Tw2TextureRes
{

    /**
     * Ordered source resource paths, channel 0 (red) first
     * @type {Array<String>}
     */
    channelPaths = [];

    /**
     * Channel count of the built texture
     * @type {Number}
     */
    _channelCount = 0;

    /**
     * Splits a `dynamic:/texturepack/` query into ordered source paths
     * @param {String} query - source paths joined with ";"
     * @returns {Array<String>|null} null when the query is malformed
     */
    static ParseQuery(query)
    {
        const paths = String(query).split(";").map(x => x.trim()).filter(x => x);
        if (paths.length < 2 || paths.length > 4) return null;
        return paths;
    }

    /**
     * Creates a pack resource from a `dynamic:/texturepack/` query
     * @param {String} query
     * @returns {Tw2TexturePackRes|null}
     */
    static FromQuery(query)
    {
        const paths = Tw2TexturePackRes.ParseQuery(query);
        if (!paths) return null;

        const res = new Tw2TexturePackRes();
        res.channelPaths = paths;
        return res;
    }

    /**
     * Fetches every source's bytes, then queues the GL assembly
     * @returns {Boolean}
     */
    DoCustomLoad()
    {
        for (const path of this.channelPaths)
        {
            if (getPathExtension(path) !== "dds")
            {
                this.OnError(new ErrResourceFormatUnsupported({
                    format: "texturepack",
                    reason: `Packed channel source is not a DDS: ${path}`
                }));
                return true;
            }
        }

        Promise
            .all(this.channelPaths.map(path => resMan.FetchRaw(tw2.GetURL(path), "arraybuffer")))
            .then(buffers =>
            {
                this.OnLoaded();
                resMan.Queue(this, buffers);
            })
            .catch(err => this.OnError(err));

        return true;
    }

    /**
     * Assembles the packed texture from the fetched source bytes
     * @param {Array<ArrayBuffer>} buffers - one per channel, in channel order
     */
    Prepare(buffers)
    {
        const gl = device.gl;

        this.DeleteGL();

        const sources = buffers.map((buffer, index) =>
        {
            try
            {
                const texture = CjsDdsFormat.read(buffer, { emit: "texture" });
                return { path: this.channelPaths[index], buffer, texture };
            }
            catch (err)
            {
                throw new ErrResourceFormatInvalid({
                    format: "texturepack",
                    reason: `Channel source '${this.channelPaths[index]}': ${err.message}`,
                    cause: err
                });
            }
        });

        const levels = this._PlanPack(sources);

        this._target = gl.TEXTURE_2D;
        this._width = levels[0].width;
        this._height = levels[0].height;
        this._channelCount = sources.length;
        this._mipCount = levels.length;
        this._hasMipMaps = levels.length > 1;
        this._isCube = false;
        this._isPowerOfTwo = (levels[0].width & (levels[0].width - 1)) === 0
            && (levels[0].height & (levels[0].height - 1)) === 0;
        this._isSRGB = false;
        // Two channels are RG8, more are RGBA8. See the class comment: an
        // RGBA8 pair would cost twice what it carries.
        const packWidth = sources.length <= 2 ? 2 : 4;

        this._type = gl.UNSIGNED_BYTE;
        this._format = packWidth === 2 ? gl.RG : gl.RGBA;
        this._internalFormat = packWidth === 2 ? gl.RG8 : gl.RGBA8;

        this.texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.texture);

        const prevUnpack = gl.getParameter(gl.UNPACK_ALIGNMENT);
        gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);

        try
        {
            const caches = sources.map(() => new Map());

            for (let mip = 0; mip < levels.length; mip++)
            {
                const { width, height } = levels[mip];
                const packed = new Uint8Array(width * height * packWidth);

                // Unwritten channels stay 0 rather than being left undefined: a
                // pack of two or three sources has real channels a shader must
                // not read, and a deterministic zero is the honest value for
                // one that was never supplied.
                for (const [ channel, source ] of sources.entries())
                {
                    const rgba = this._SourceRgbaAt(source, caches[channel], width, height);

                    for (let texel = 0, at = channel; texel < width * height; texel++, at += packWidth)
                    {
                        // RED of the source, whatever it spelled its scalar as.
                        packed[at] = rgba[texel * 4];
                    }
                }

                gl.texImage2D(
                    gl.TEXTURE_2D, mip, this._internalFormat,
                    width, height, 0,
                    this._format, gl.UNSIGNED_BYTE,
                    packed
                );
            }

            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_BASE_LEVEL, 0);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAX_LEVEL, levels.length - 1);

            if (levels.length === 1)
            {
                // Same reasoning as the array: Tw2SamplerState.Apply clamps the
                // wrap mode of anything without mips, and these maps tile.
                gl.generateMipmap(gl.TEXTURE_2D);
                this._hasMipMaps = true;
            }
        }
        catch (err)
        {
            gl.deleteTexture(this.texture);
            this.texture = null;
            throw err;
        }
        finally
        {
            gl.pixelStorei(gl.UNPACK_ALIGNMENT, prevUnpack);
            gl.bindTexture(gl.TEXTURE_2D, null);
        }

        this._isAttached = false;
        this.OnPrepared();
    }

    /**
     * Decides the packed texture's sizes, largest first.
     *
     * The largest source sets the size and its own chain sets the levels, for
     * the reason in the class comment: the aggregate is one RGBA texture either
     * way, so there is nothing to buy by going smaller.
     *
     * @param {Array<{path:String, texture:Object}>} sources
     * @returns {Array<{width:Number, height:Number}>}
     * @private
     */
    _PlanPack(sources)
    {
        for (const { texture, path } of sources)
        {
            if (texture.dimension !== "2d" || texture.arraySize !== 1 || texture.faces !== 1)
            {
                throw new ErrResourceFormatUnsupported({
                    format: "texturepack",
                    reason: `Channel source '${path}' is not a plain 2D texture (${texture.dimension}, ${texture.faces} face(s))`
                });
            }
        }

        let reference = sources[0].texture;
        let referencePath = sources[0].path;

        for (const { texture, path } of sources)
        {
            if (texture.width * texture.height > reference.width * reference.height)
            {
                reference = texture;
                referencePath = path;
            }
        }

        for (const { texture, path } of sources)
        {
            // Cross-multiplied, so 2048x1024 and 4096x2048 reconcile while
            // 2048x1024 against 4096x4096 does not. These maps share a UV set;
            // one that does not share an aspect is not the same UV set, and
            // stretching it would put a plausible image in a channel.
            if (texture.width * reference.height !== reference.width * texture.height)
            {
                throw new ErrResourceFormatUnsupported({
                    format: "texturepack",
                    reason: `Channel source '${path}' is ${texture.width}x${texture.height}, a different aspect to `
                        + `'${referencePath}' at ${reference.width}x${reference.height}; refusing to stretch it`
                });
            }
        }

        return reference.subresources
            .filter(s => !s.face)
            .sort((a, b) => (b.width * b.height) - (a.width * a.height))
            .map(s => ({ width: s.width, height: s.height }));
    }

    /**
     * One source's RGBA pixels at an exact size, reusing an authored mip when
     * the size already matches
     * @param {{path:String, buffer:ArrayBuffer, texture:Object}} source
     * @param {Map<Object, Uint8Array>} cache
     * @param {Number} width
     * @param {Number} height
     * @returns {Uint8Array}
     * @private
     */
    _SourceRgbaAt(source, cache, width, height)
    {
        const candidates = source.texture.subresources.filter(s => !s.face);

        if (!candidates.length)
        {
            throw new ErrResourceFormatInvalid({
                format: "texturepack",
                reason: `Channel source '${source.path}' has no 2D surface to build from`
            });
        }

        const exact = candidates.find(s => s.width === width && s.height === height);
        const larger = candidates
            .filter(s => s.width >= width && s.height >= height)
            .sort((a, b) => (a.width * a.height) - (b.width * b.height))[0];
        const largest = candidates
            .slice()
            .sort((a, b) => (b.width * b.height) - (a.width * a.height))[0];

        const chosen = exact || larger || largest;
        let rgba = cache.get(chosen);

        if (!rgba)
        {
            const surfaceDds = TextureFormatDDS.CreateSurfaceDDS(source.buffer, source.texture, chosen);
            rgba = CjsDdsFormat.read(surfaceDds, { emit: "rgba" }).data;
            cache.set(chosen, rgba);
        }

        return chosen.width === width && chosen.height === height
            ? rgba
            : Tw2TextureArrayRes.ResampleRgba(rgba, chosen.width, chosen.height, width, height);
    }

}
