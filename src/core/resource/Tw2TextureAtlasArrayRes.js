import { getPathExtension } from "utils";
import { device, tw2, resMan } from "global";
import { CjsDdsFormat } from "@carbonenginejs/runtime-resource/formats/dds";
import { Tw2TextureArrayRes } from "./Tw2TextureArrayRes";
import {
    ErrResourceFormatInvalid,
    ErrResourceFormatUnsupported
} from "./Tw2Resource";
import { TextureFormatDDS } from "./formats/TextureFormatDDS";


/**
 * Tw2TextureAtlasArrayRes
 *
 * One DDS holding a vertical strip of equally sized tiles, realized as a real
 * `TEXTURE_2D_ARRAY` with one layer per tile.
 *
 * This exists because the same file is addressed two different ways. The
 * hand written GLES shaders sample a booster shape atlas as a flat 2D sheet and
 * do the tile arithmetic themselves; Carbon's own dx11 shaders declare it as a
 * `sampler2DArray` and index it with the atlas slot. `Tw2TextureRes.Bind`
 * refuses to bind a texture whose target disagrees with the sampler's, so on
 * the Carbon path the flat sheet bound nothing at all and the flame sampled
 * the fallback.
 *
 * The tile count cannot be read off the file - a 32x256 DDS is equally a
 * 32x256 sheet - so it comes from the caller, which for boosters is SOF's
 * `shapeAtlasCount`.
 *
 *     dynamic:/textureatlasarray/<count>;<path>
 *
 * Only mip 0 is uploaded. A block compressed strip can only be sliced on block
 * boundaries, and the lower mips of a tile this small are sub-block, so the
 * chain would have to stop part way regardless; the level range is pinned to 0
 * rather than left incomplete, which GL would sample as black.
 */
export class Tw2TextureAtlasArrayRes extends Tw2TextureArrayRes
{

    /**
     * The source strip's path
     * @type {String}
     */
    sourcePath = "";

    /**
     * How many tiles the strip is divided into
     * @type {Number}
     */
    layerCount = 0;

    /**
     * Splits a `dynamic:/textureatlasarray/` query into its count and path
     * @param {String} query - "<count>;<path>"
     * @returns {{count: Number, path: String}|null} null when malformed
     */
    static ParseQuery(query)
    {
        const parts = String(query).split(";");
        if (parts.length < 2) return null;

        const
            count = Number(parts[0].trim()),
            path = parts.slice(1).join(";").trim();

        if (!path || !Number.isFinite(count) || count < 1) return null;
        return { count: Math.trunc(count), path };
    }

    /**
     * Creates an atlas array resource from a query
     * @param {String} query
     * @returns {Tw2TextureAtlasArrayRes|null}
     */
    static FromQuery(query)
    {
        const parsed = Tw2TextureAtlasArrayRes.ParseQuery(query);
        if (!parsed) return null;

        const res = new Tw2TextureAtlasArrayRes();
        res.sourcePath = parsed.path;
        res.layerCount = parsed.count;
        res.layerPaths = [ parsed.path ];
        return res;
    }

    /**
     * Fetches the strip, then queues the GL assembly
     * @returns {Boolean} true - the resource loads itself
     */
    DoCustomLoad()
    {
        if (getPathExtension(this.sourcePath) !== "dds")
        {
            this.OnError(new ErrResourceFormatUnsupported({
                format: "textureatlasarray",
                reason: `Atlas source is not a DDS: ${this.sourcePath}`
            }));
            return true;
        }

        resMan
            .FetchRaw(tw2.GetURL(this.sourcePath), "arraybuffer")
            .then(buffer =>
            {
                this.OnLoaded();
                resMan.Queue(this, [ buffer ]);
            })
            .catch(err => this.OnError(err));

        return true;
    }

    /**
     * Slices the strip into layers and uploads them as one array
     * @param {Array<ArrayBuffer>} buffers - the single fetched strip
     */
    Prepare(buffers)
    {
        const gl = device.gl;

        if (device.glVersion < 2 || !gl.texImage3D)
        {
            throw new ErrResourceFormatUnsupported({
                format: "textureatlasarray",
                reason: "2D array textures require WebGL2"
            });
        }

        this.DeleteGL();

        let texture;
        try
        {
            texture = CjsDdsFormat.read(buffers[0], { emit: "texture" });
        }
        catch (err)
        {
            throw new ErrResourceFormatInvalid({
                format: "textureatlasarray",
                reason: `Atlas '${this.sourcePath}': ${err.message}`,
                cause: err
            });
        }

        if (texture.dimension !== "2d" || texture.arraySize !== 1 || texture.faces !== 1)
        {
            throw new ErrResourceFormatUnsupported({
                format: "textureatlasarray",
                reason: `Atlas '${this.sourcePath}' is not a plain 2D texture (${texture.dimension}, ${texture.faces} face(s))`
            });
        }

        const
            info = TextureFormatDDS.ResolveTexturePayload(texture, gl),
            count = this.layerCount,
            layerHeight = texture.height / count;

        if (!Number.isInteger(layerHeight) || layerHeight < 1)
        {
            throw new ErrResourceFormatUnsupported({
                format: "textureatlasarray",
                reason: `Atlas '${this.sourcePath}' height ${texture.height} does not divide into ${count} layers`
            });
        }

        // A block compressed strip is stored as rows of 4x4 blocks, so a tile
        // boundary is only a byte boundary when the tile height is a multiple
        // of the block height. Refuse rather than upload a sheared atlas.
        if (info.isCompressed && layerHeight % 4)
        {
            throw new ErrResourceFormatUnsupported({
                format: "textureatlasarray",
                reason: `Atlas '${this.sourcePath}' layer height ${layerHeight} is not block aligned`
            });
        }

        const
            surface = texture.subresources.find(s => s.mip === 0 && s.face === 0)
                || texture.subresources.find(s => s.mip === 0),
            bytes = texture.data.subarray(surface.offset, surface.offset + surface.byteLength),
            layerBytes = bytes.byteLength / count;

        if (!Number.isInteger(layerBytes))
        {
            throw new ErrResourceFormatInvalid({
                format: "textureatlasarray",
                reason: `Atlas '${this.sourcePath}' mip 0 is ${bytes.byteLength} bytes, which does not divide into ${count} layers`
            });
        }

        this._target = gl.TEXTURE_2D_ARRAY;
        this._width = texture.width;
        this._height = layerHeight;
        this._layerCount = count;
        this._mipCount = 1;
        this._hasMipMaps = false;
        this._isCube = false;
        this._isPowerOfTwo = this.constructor.IsPowerOfTwo(texture.width, layerHeight);
        this._isSRGB = !!info.isSRGB;
        this._type = info.type ?? gl.UNSIGNED_BYTE;
        this._format = info.format;
        this._internalFormat = info.internalFormat;

        this.texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D_ARRAY, this.texture);

        const prevUnpack = gl.getParameter(gl.UNPACK_ALIGNMENT);
        gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);

        try
        {
            // The strip is already tile major top to bottom, so the layers are
            // contiguous and in order - the whole mip is the array payload.
            if (info.isCompressed && info.clientSupport)
            {
                gl.compressedTexImage3D(
                    gl.TEXTURE_2D_ARRAY, 0, info.internalFormat,
                    texture.width, layerHeight, count, 0, bytes
                );
            }
            else if (info.clientSupport)
            {
                gl.texImage3D(
                    gl.TEXTURE_2D_ARRAY, 0, info.internalFormat,
                    texture.width, layerHeight, count, 0,
                    info.format, info.type ?? gl.UNSIGNED_BYTE, bytes
                );
            }
            else
            {
                throw new ErrResourceFormatUnsupported({
                    format: "textureatlasarray",
                    reason: `Atlas '${this.sourcePath}' pixel format ${info.name} is not supported by this client`
                });
            }

            gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_BASE_LEVEL, 0);
            gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAX_LEVEL, 0);
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
            gl.bindTexture(gl.TEXTURE_2D_ARRAY, null);
        }

        this._isAttached = false;
        this.OnPrepared();
    }

}
