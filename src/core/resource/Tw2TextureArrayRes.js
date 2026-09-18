import { meta, getPathExtension } from "utils";
import { device, tw2, resMan } from "global";
import { CjsDdsFormat } from "@carbonenginejs/runtime/resource/formats/dds";
import { Tw2TextureRes } from "./Tw2TextureRes";
import {
    ErrResourceFormatInvalid,
    ErrResourceFormatUnsupported
} from "./Tw2Resource";
import { TextureFormatDDS } from "./formats/TextureFormatDDS";


/**
 * A 2D array texture assembled from ordered single-layer sources, addressed as
 * `dynamic:/texturearray/<layer0>;<layer1>[;<layer2>...]`.
 *
 * This is the ccpwgl realization of the texture-array contract the Carbon
 * WebGL emitter's `detail-map-array` transform requires: the recipe merges
 * Detail1Map/Detail2Map/Detail3Map into one `sampler2DArray`, and *something*
 * has to own the GPU array that uniform samples. Resolving through the
 * resource manager is what gives sharing for free - two hulls whose detail
 * maps are the same three files resolve to the same path, and the cache lookup
 * in Tw2ResMan.GetResource hands both the same array.
 *
 * The array is one GL object with one sampler state and one topology, so the
 * layers must end up agreeing on dimensions, pixel format and mip count. They
 * do not always start that way, and a rejection is the wrong answer: the
 * aggregate binds the 1x1 fallback, which blanks the maps rather than failing
 * loudly. So layers that disagree are converted.
 *
 * Which way it converts is decided by the layers, in `_PlanArray`, and the
 * reason is memory rather than taste.
 *
 * When the layers share a block format, the array settles on the largest level
 * every one of their chains already contains, and each contributes its own
 * surfaces from there down - still compressed, not a pixel resampled. The mip
 * chains make this free: a 4096 chain contains 2048 exactly, so a 2048 layer
 * joins it whole. Measured on the pair that prompted this, BC3 detail maps at
 * 4096 and 2048, that array is about 11MB.
 *
 * When their formats disagree there is nothing to share in block form and every
 * layer has to be decoded to RGBA anyway. Having paid that, the array goes UP
 * to the largest layer and keeps everything the art has - `_LayerRgbaAt` still
 * reuses an authored mip wherever one matches, so only the top level of an
 * undersized layer is ever synthesised.
 *
 * Going up unconditionally was the first answer and it is the wrong one: for
 * the same BC3 pair it costs about 170MB against 11MB, fifteen times the memory
 * to keep one mip level that is only visible at closest range.
 *
 * What is still refused is a layer whose ASPECT differs, because matching it
 * means stretching, and a stretched detail map is the kind of wrong that never
 * gets reported.
 *
 * While unbuilt (loading, rejected or incomplete), consumers keep binding the
 * 1x1 fallback array texture, which renders without detail rather than without
 * a draw.
 *
 * Layers are DDS only. Detail maps ship as DDS with full mip chains, and the
 * mips matter beyond quality: Tw2SamplerState.Apply clamps the wrap mode of
 * any texture without mips, and detail maps tile, so a mipless array would
 * silently lose its REPEAT addressing.
 */
@meta.define("Tw2TextureArrayRes")
export class Tw2TextureArrayRes extends Tw2TextureRes
{

    /**
     * Ordered layer resource paths, layer 0 first
     * @type {Array<String>}
     */
    layerPaths = [];

    /**
     * Layer count of the built array
     * @type {Number}
     */
    _layerCount = 0;

    /**
     * Splits a `dynamic:/texturearray/` query into ordered layer paths
     * @param {String} query - layer paths joined with ";"
     * @returns {Array<String>|null} null when the query is malformed
     */
    static ParseQuery(query)
    {
        const paths = String(query).split(";").map(x => x.trim()).filter(x => x);
        if (paths.length < 2) return null;
        return paths;
    }

    /**
     * Creates an array resource from a `dynamic:/texturearray/` query
     * @param {String} query
     * @returns {Tw2TextureArrayRes|null}
     */
    static FromQuery(query)
    {
        const paths = Tw2TextureArrayRes.ParseQuery(query);
        if (!paths) return null;

        const res = new Tw2TextureArrayRes();
        res.layerPaths = paths;
        return res;
    }

    /**
     * Fetches every layer's bytes, then queues the GL assembly.
     * Returning true tells the resource manager the resource has handled its
     * own loading and must not be fetched.
     * @returns {Boolean}
     */
    DoCustomLoad()
    {
        for (const path of this.layerPaths)
        {
            if (getPathExtension(path) !== "dds")
            {
                this.OnError(new ErrResourceFormatUnsupported({
                    format: "texturearray",
                    reason: `Array layer is not a DDS: ${path}`
                }));
                return true;
            }
        }

        Promise
            .all(this.layerPaths.map(path => resMan.FetchRaw(tw2.GetURL(path), "arraybuffer")))
            .then(buffers =>
            {
                this.OnLoaded();
                resMan.Queue(this, buffers);
            })
            .catch(err => this.OnError(err));

        return true;
    }

    /**
     * Assembles the array from the fetched layer bytes
     * @param {Array<ArrayBuffer>} buffers - one per layer, in layer order
     */
    Prepare(buffers)
    {
        const gl = device.gl;

        if (device.glVersion < 2 || !gl.texImage3D)
        {
            throw new ErrResourceFormatUnsupported({
                format: "texturearray",
                reason: "2D array textures require WebGL2"
            });
        }

        this.DeleteGL();

        const layers = buffers.map((buffer, index) =>
        {
            try
            {
                const texture = CjsDdsFormat.read(buffer, { emit: "texture" });
                return { path: this.layerPaths[index], buffer, texture };
            }
            catch (err)
            {
                throw new ErrResourceFormatInvalid({
                    format: "texturearray",
                    reason: `Layer '${this.layerPaths[index]}': ${err.message}`,
                    cause: err
                });
            }
        });

        // One array is one topology. Decide it before touching GL, so a layer
        // that cannot be reconciled is named and leaves no half-built texture.
        const plan = this._PlanArray(layers);

        // The reference layer speaks for the array's GL formats. It is the
        // LARGEST layer, not layers[0]: which path came first in the query is
        // an accident of the shader's parameter order, and letting it decide
        // the array's size would make the result depend on that order.
        const info = TextureFormatDDS.ResolveTexturePayload(plan.reference, gl);

        // From the PLAN, not from `info`: the plan's levels may start below the
        // reference's own mip 0 when the array settles on a shared level.
        this._target = gl.TEXTURE_2D_ARRAY;
        this._width = plan.levels[0].width;
        this._height = plan.levels[0].height;
        this._layerCount = layers.length;
        this._mipCount = plan.levels.length;
        this._hasMipMaps = plan.levels.length > 1;
        this._isCube = false;
        this._isPowerOfTwo = info.isPowerOfTwo;
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
            if (plan.convert)
            {
                // Formats disagree, so nothing can be shared in block form and
                // every layer has to be decoded. Since that cost is already
                // being paid, the array goes UP to the largest layer and keeps
                // what the art has.
                this._UploadConverted(gl, layers, info, plan.levels);
            }
            else if (info.clientSupport)
            {
                this._UploadNative(gl, layers, info, plan.levels);
            }
            else
            {
                this._UploadRgbaFallback(gl, layers, info, plan.levels);
            }

            if (plan.levels.length > 1)
            {
                // Same reasoning as TextureFormatDDS.DeclareLevelRange: a DDS
                // chain that stops short of 1x1 is only mip-complete if GL is
                // told where it stops.
                gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_BASE_LEVEL, 0);
                gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAX_LEVEL, plan.levels.length - 1);
            }
            else if (plan.convert || !info.isCompressed || !info.clientSupport)
            {
                // Detail maps tile, and Tw2SamplerState.Apply forces
                // CLAMP_TO_EDGE on anything without mips - so a chainless
                // source gets one generated rather than losing its REPEAT.
                gl.generateMipmap(gl.TEXTURE_2D_ARRAY);
                this._hasMipMaps = true;
            }
            else
            {
                // Compressed without a chain: mips cannot be generated, and
                // the sampler gate will clamp what should wrap. Say so rather
                // than leave the symptom unattributable.
                console.warn(`Tw2TextureArrayRes: '${this.path}' is compressed with a single mip; tiling will clamp instead of wrap`);
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
            gl.bindTexture(gl.TEXTURE_2D_ARRAY, null);
        }

        this._isAttached = false;
        this.OnPrepared();
    }

    /**
     * Decides the one topology every layer has to end up in.
     *
     * Two ways out, and which one applies is a property of the layers rather
     * than a policy:
     *
     * **They already share block formats.** Then the array can settle on a
     * level every layer's chain already contains, and each layer contributes
     * its own authored surfaces from there down - compressed, untouched, not a
     * pixel resampled. The largest shared level is taken, so this gives up
     * only the levels above it, and only for the layers that had them.
     *
     * **Their formats disagree.** Then nothing can be shared in block form and
     * every layer has to be decoded to RGBA regardless. That cost is what makes
     * the direction free, so the array goes UP to the largest layer and keeps
     * everything the art has.
     *
     * The first case is worth the branch rather than always going up: a pair of
     * BC3 detail maps at 4096 and 2048 settle at 2048 for about 11MB, where
     * decoding and upscaling them to 4096 is about 170MB for one extra mip
     * level that is only visible at closest range.
     *
     * @param {Array<{path:String, texture:Object}>} layers
     * @returns {{reference:Object, levels:Array<{width:Number, height:Number}>, convert:Boolean}}
     */
    _PlanArray(layers)
    {
        for (const { texture, path } of layers)
        {
            if (texture.dimension !== "2d" || texture.arraySize !== 1 || texture.faces !== 1)
            {
                throw new ErrResourceFormatUnsupported({
                    format: "texturearray",
                    reason: `Layer '${path}' is not a plain 2D texture (${texture.dimension}, ${texture.faces} face(s))`
                });
            }
        }

        let reference = layers[0].texture;
        let referencePath = layers[0].path;

        for (const { texture, path } of layers)
        {
            if (texture.width * texture.height > reference.width * reference.height)
            {
                reference = texture;
                referencePath = path;
            }
        }

        let convert = false;

        for (const { texture, path } of layers)
        {
            // Cross-multiplied so the comparison is exact: 2048x1024 and
            // 4096x2048 are the same aspect and must reconcile, while
            // 2048x1024 against 4096x4096 is a stretch and must not.
            if (texture.width * reference.height !== reference.width * texture.height)
            {
                throw new ErrResourceFormatUnsupported({
                    format: "texturearray",
                    reason: `Layer '${path}' is ${texture.width}x${texture.height}, which is a different aspect to `
                        + `layer '${referencePath}' at ${reference.width}x${reference.height}; `
                        + "matching it would mean stretching, so this array is refused"
                });
            }

            if (texture.pixelFormat !== reference.pixelFormat) convert = true;
        }

        // Every size the reference offers that every other layer also offers,
        // largest first. When the layers already agree this is the whole chain
        // and nothing below changes; when they differ by a power of two it is
        // the smaller layer's chain, which is why going down costs no work.
        const shared = convert ? [] : reference.subresources
            .filter(s => !s.face)
            .filter(s => layers.every(({ texture }) => texture.subresources
                .some(other => !other.face && other.width === s.width && other.height === s.height)))
            .sort((a, b) => (b.width * b.height) - (a.width * a.height))
            .map(s => ({ width: s.width, height: s.height }));

        // Same format but no level in common - an odd pair of sizes rather than
        // a power-of-two relative. Nothing to share, so it decodes like a
        // format mismatch.
        if (!convert && !shared.length) convert = true;

        const levels = convert
            ? reference.subresources
                .filter(s => !s.face)
                .sort((a, b) => (b.width * b.height) - (a.width * a.height))
                .map(s => ({ width: s.width, height: s.height }))
            : shared;

        return { reference, levels, convert };
    }

    /**
     * Uploads layers that had to be reconciled, decoded to RGBA and resampled
     * to the array's size.
     *
     * One texImage3D per mip, as the other paths do. The per-layer work is in
     * `_LayerRgbaAt`, which reuses an authored mip whenever one already matches
     * the target size.
     *
     * @param {WebGL2RenderingContext} gl
     * @param {Array<{path:String, buffer:ArrayBuffer, texture:Object}>} layers
     * @param {Object} info - resolved GL format info for the reference layer
     * @param {Array<{width:Number, height:Number}>} levels - the array's sizes, mip 0 first
     */
    _UploadConverted(gl, layers, info, levels)
    {
        this._type = gl.UNSIGNED_BYTE;
        this._format = gl.RGBA;
        this._internalFormat = info.isSRGB ? gl.SRGB8_ALPHA8 : gl.RGBA;

        // Decoding is the expensive half, and the same source mip serves more
        // than one target mip when sizes differ, so each layer remembers what
        // it has already decoded for the life of this upload.
        const caches = layers.map(() => new Map());

        for (let mip = 0; mip < levels.length; mip++)
        {
            const { width, height } = levels[mip];
            const parts = layers.map((layer, index) => this._LayerRgbaAt(layer, caches[index], width, height));

            gl.texImage3D(
                gl.TEXTURE_2D_ARRAY, mip, this._internalFormat,
                width, height, layers.length, 0,
                gl.RGBA, gl.UNSIGNED_BYTE,
                Tw2TextureArrayRes.ConcatBytes(parts)
            );
        }
    }

    /**
     * One layer's RGBA pixels at an exact size.
     *
     * Prefers the layer's own mip at that size, then the smallest larger one,
     * and only upscales from the largest when the layer has nothing bigger.
     * That ordering is what makes going up cheap: with the usual power-of-two
     * chains the exact match is hit for every mip but the top, so the array
     * carries authored pixels almost everywhere.
     *
     * @param {{path:String, buffer:ArrayBuffer, texture:Object}} layer
     * @param {Map<Object, Uint8Array>} cache - decoded surfaces, this upload only
     * @param {Number} width
     * @param {Number} height
     * @returns {Uint8Array} RGBA8 pixels, width * height * 4
     */
    _LayerRgbaAt(layer, cache, width, height)
    {
        const candidates = layer.texture.subresources.filter(s => !s.face);

        if (!candidates.length)
        {
            throw new ErrResourceFormatInvalid({
                format: "texturearray",
                reason: `Layer '${layer.path}' has no 2D surface to build from`
            });
        }

        const exact = candidates.find(s => s.width === width && s.height === height);
        const larger = candidates
            .filter(s => s.width >= width && s.height >= height)
            .sort((a, b) => (a.width * a.height) - (b.width * b.height))[0];
        const largest = candidates
            .slice()
            .sort((a, b) => (b.width * b.height) - (a.width * a.height))[0];

        const source = exact || larger || largest;
        const rgba = this._DecodeSurface(layer, cache, source);

        return source.width === width && source.height === height
            ? rgba
            : Tw2TextureArrayRes.ResampleRgba(rgba, source.width, source.height, width, height);
    }

    /**
     * Decodes one of a layer's surfaces to RGBA, remembering the result
     * @param {{path:String, buffer:ArrayBuffer, texture:Object}} layer
     * @param {Map<Object, Uint8Array>} cache
     * @param {Object} subresource
     * @returns {Uint8Array}
     */
    _DecodeSurface(layer, cache, subresource)
    {
        if (cache.has(subresource)) return cache.get(subresource);

        const surfaceDds = TextureFormatDDS.CreateSurfaceDDS(layer.buffer, layer.texture, subresource);
        const rgba = CjsDdsFormat.read(surfaceDds, { emit: "rgba" }).data;

        cache.set(subresource, rgba);
        return rgba;
    }

    /**
     * Resamples RGBA8 pixels to an exact size.
     *
     * An exact halving is averaged, because that is a mip reduction and taking
     * the four texels is both correct and cheaper than interpolating.
     * Everything else is bilinear.
     *
     * Deliberately no sRGB decode around the filter. Every family this merges
     * is recognised only when `isSRGB` is false - the WebGL emitter's family
     * recogniser requires it of every layer - so these pixels are already
     * linear and decoding them would be the error.
     *
     * @param {Uint8Array} src
     * @param {Number} srcWidth
     * @param {Number} srcHeight
     * @param {Number} dstWidth
     * @param {Number} dstHeight
     * @returns {Uint8Array}
     */
    static ResampleRgba(src, srcWidth, srcHeight, dstWidth, dstHeight)
    {
        const out = new Uint8Array(dstWidth * dstHeight * 4);

        if (srcWidth === dstWidth * 2 && srcHeight === dstHeight * 2)
        {
            for (let y = 0; y < dstHeight; y++)
            {
                for (let x = 0; x < dstWidth; x++)
                {
                    const a = ((y * 2) * srcWidth + (x * 2)) * 4;
                    const b = a + 4;
                    const c = a + srcWidth * 4;
                    const d = c + 4;
                    const o = (y * dstWidth + x) * 4;

                    for (let channel = 0; channel < 4; channel++)
                    {
                        out[o + channel] = (src[a + channel] + src[b + channel] + src[c + channel] + src[d + channel] + 2) >> 2;
                    }
                }
            }

            return out;
        }

        // Half-texel centred, so an upscale does not shift the image half a
        // texel toward the origin - which tiles visibly on a detail map.
        const scaleX = srcWidth / dstWidth;
        const scaleY = srcHeight / dstHeight;

        for (let y = 0; y < dstHeight; y++)
        {
            const sourceY = Math.min(srcHeight - 1, Math.max(0, (y + 0.5) * scaleY - 0.5));
            const y0 = Math.floor(sourceY);
            const y1 = Math.min(srcHeight - 1, y0 + 1);
            const fy = sourceY - y0;

            for (let x = 0; x < dstWidth; x++)
            {
                const sourceX = Math.min(srcWidth - 1, Math.max(0, (x + 0.5) * scaleX - 0.5));
                const x0 = Math.floor(sourceX);
                const x1 = Math.min(srcWidth - 1, x0 + 1);
                const fx = sourceX - x0;

                const a = (y0 * srcWidth + x0) * 4;
                const b = (y0 * srcWidth + x1) * 4;
                const c = (y1 * srcWidth + x0) * 4;
                const d = (y1 * srcWidth + x1) * 4;
                const o = (y * dstWidth + x) * 4;

                for (let channel = 0; channel < 4; channel++)
                {
                    const top = src[a + channel] + (src[b + channel] - src[a + channel]) * fx;
                    const bottom = src[c + channel] + (src[d + channel] - src[c + channel]) * fx;

                    out[o + channel] = Math.round(top + (bottom - top) * fy);
                }
            }
        }

        return out;
    }

    /**
     * Uploads natively supported layer payloads, one texImage3D per mip with
     * the layers packed in order
     * @param {WebGL2RenderingContext} gl
     * @param {Array<{path:String, buffer:ArrayBuffer, texture:Object}>} layers
     * @param {Object} info - resolved GL format info
     * @param {Array<{width:Number, height:Number}>} levels - the array's sizes, mip 0 first
     */
    _UploadNative(gl, layers, info, levels)
    {
        for (let mip = 0; mip < levels.length; mip++)
        {
            const { width, height } = levels[mip];
            const surfaces = layers.map(layer => this._GetLayerSurface(layer, width, height));

            if (info.isCompressed)
            {
                const data = Tw2TextureArrayRes.ConcatBytes(surfaces.map(s => s.bytes));
                gl.compressedTexImage3D(
                    gl.TEXTURE_2D_ARRAY, mip, info.internalFormat,
                    width, height, layers.length, 0, data
                );
            }
            else
            {
                const typed = surfaces.map(s => info.type === gl.FLOAT
                    ? new Float32Array(s.bytes.buffer, s.bytes.byteOffset, s.bytes.byteLength >> 2)
                    : info.type === gl.HALF_FLOAT
                        ? new Uint16Array(s.bytes.buffer, s.bytes.byteOffset, s.bytes.byteLength >> 1)
                        : s.bytes);

                gl.texImage3D(
                    gl.TEXTURE_2D_ARRAY, mip, info.internalFormat,
                    width, height, layers.length, 0,
                    info.format, info.type,
                    Tw2TextureArrayRes.ConcatBytes(typed)
                );
            }
        }
    }

    /**
     * Uploads layers a client cannot sample natively by decoding each surface
     * to RGBA, layer by layer, mip by mip
     * @param {WebGL2RenderingContext} gl
     * @param {Array<{path:String, buffer:ArrayBuffer, texture:Object}>} layers
     * @param {Object} info - resolved GL format info
     * @param {Array<{width:Number, height:Number}>} levels - the array's sizes, mip 0 first
     */
    _UploadRgbaFallback(gl, layers, info, levels)
    {
        const isFloat = info.pixelFormat.includes("float");
        this._type = isFloat ? gl.FLOAT : gl.UNSIGNED_BYTE;
        this._format = gl.RGBA;
        this._internalFormat = isFloat ? gl.RGBA32F : (info.isSRGB ? gl.SRGB8_ALPHA8 : gl.RGBA);

        for (let mip = 0; mip < levels.length; mip++)
        {
            const { width, height } = levels[mip];
            const decoded = layers.map(layer =>
            {
                const { subresource } = this._GetLayerSurface(layer, width, height);
                const surfaceDds = TextureFormatDDS.CreateSurfaceDDS(layer.buffer, layer.texture, subresource);
                return { rgba: CjsDdsFormat.read(surfaceDds, { emit: "rgba" }).data, subresource };
            });

            gl.texImage3D(
                gl.TEXTURE_2D_ARRAY, mip, this._internalFormat,
                width, height, layers.length, 0,
                gl.RGBA, this._type,
                Tw2TextureArrayRes.ConcatBytes(decoded.map(d => d.rgba))
            );
        }
    }

    /**
     * Gets one layer's surface bytes at an exact size.
     *
     * By SIZE rather than by mip index, because the array's mip 0 is not always
     * every layer's mip 0: a layer larger than the array contributes from
     * further down its own chain. For layers that agree this is the same
     * surface the index would have found.
     *
     * @param {{path:String, texture:Object}} layer
     * @param {Number} width
     * @param {Number} height
     * @returns {{subresource:Object, bytes:Uint8Array}}
     */
    _GetLayerSurface(layer, width, height)
    {
        const subresource = layer.texture.subresources
            .find(s => !s.face && s.width === width && s.height === height);

        if (!subresource)
        {
            throw new ErrResourceFormatInvalid({
                format: "texturearray",
                reason: `Layer '${layer.path}' has no ${width}x${height} surface`
            });
        }

        return {
            subresource,
            bytes: layer.texture.data.subarray(subresource.offset, subresource.offset + subresource.byteLength)
        };
    }

    /**
     * Concatenates typed arrays of one element type into a single array
     * @param {Array<Uint8Array|Uint16Array|Float32Array>} parts
     * @returns {Uint8Array|Uint16Array|Float32Array}
     */
    static ConcatBytes(parts)
    {
        const DataArray = parts[0] ? parts[0].constructor : Uint8Array;
        let total = 0;
        for (const part of parts) total += part.length;

        const out = new DataArray(total);
        let offset = 0;
        for (const part of parts)
        {
            out.set(part, offset);
            offset += part.length;
        }
        return out;
    }

}
