import { meta, getPathExtension } from "utils";
import { device, tw2, resMan } from "global";
import { CjsDdsFormat } from "@carbonenginejs/runtime-resource/formats/dds";
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
 * layers must agree on dimensions, pixel format and mip count. Disagreement
 * rejects the whole array - naming the layer that disagreed - rather than
 * stretching or re-encoding, because a silently resampled detail map is the
 * kind of wrong that never gets reported. While unbuilt (loading, rejected or
 * incomplete), consumers keep binding the 1x1 fallback array texture, which
 * renders without detail rather than without a draw.
 *
 * Layers are DDS only. Detail maps ship as DDS with full mip chains, and the
 * mips matter beyond quality: Tw2SamplerState.Apply clamps the wrap mode of
 * any texture without mips, and detail maps tile, so a mipless array would
 * silently lose its REPEAT addressing.
 */
@meta.type("Tw2TextureArrayRes")
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

        // One array is one topology. Validate before touching GL so a rejection
        // names the layer that disagreed and leaves no half-built texture.
        const first = layers[0].texture;
        for (const layer of layers)
        {
            const { texture, path } = layer;

            if (texture.dimension !== "2d" || texture.arraySize !== 1 || texture.faces !== 1)
            {
                throw new ErrResourceFormatUnsupported({
                    format: "texturearray",
                    reason: `Layer '${path}' is not a plain 2D texture (${texture.dimension}, ${texture.faces} face(s))`
                });
            }

            for (const [ property, label ] of [
                [ "width", "width" ],
                [ "height", "height" ],
                [ "mipCount", "mip count" ],
                [ "pixelFormat", "pixel format" ]
            ])
            {
                if (texture[property] !== first[property])
                {
                    throw new ErrResourceFormatUnsupported({
                        format: "texturearray",
                        reason: `Layer '${path}' ${label} ${texture[property]} disagrees with layer '${layers[0].path}' ${label} ${first[property]}; refusing to merge`
                    });
                }
            }
        }

        // The first layer speaks for the topology every layer just proved it
        // shares, so its resolved GL formats are the array's.
        const info = TextureFormatDDS.ResolveTexturePayload(first, gl);

        this._target = gl.TEXTURE_2D_ARRAY;
        this._width = info.width;
        this._height = info.height;
        this._layerCount = layers.length;
        this._mipCount = info.mipmaps;
        this._hasMipMaps = info.mipmaps > 1;
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
            if (info.clientSupport)
            {
                this._UploadNative(gl, layers, info);
            }
            else
            {
                this._UploadRgbaFallback(gl, layers, info);
            }

            if (info.mipmaps > 1)
            {
                // Same reasoning as TextureFormatDDS.DeclareLevelRange: a DDS
                // chain that stops short of 1x1 is only mip-complete if GL is
                // told where it stops.
                gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_BASE_LEVEL, 0);
                gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAX_LEVEL, info.mipmaps - 1);
            }
            else if (!info.isCompressed || !info.clientSupport)
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
     * Uploads natively supported layer payloads, one texImage3D per mip with
     * the layers packed in order
     * @param {WebGL2RenderingContext} gl
     * @param {Array<{path:String, buffer:ArrayBuffer, texture:Object}>} layers
     * @param {Object} info - resolved GL format info
     */
    _UploadNative(gl, layers, info)
    {
        for (let mip = 0; mip < info.mipmaps; mip++)
        {
            const surfaces = layers.map(layer => this._GetLayerSurface(layer, mip));
            const { width, height } = surfaces[0].subresource;

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
     */
    _UploadRgbaFallback(gl, layers, info)
    {
        const isFloat = info.pixelFormat.includes("float");
        this._type = isFloat ? gl.FLOAT : gl.UNSIGNED_BYTE;
        this._format = gl.RGBA;
        this._internalFormat = isFloat ? gl.RGBA32F : (info.isSRGB ? gl.SRGB8_ALPHA8 : gl.RGBA);

        for (let mip = 0; mip < info.mipmaps; mip++)
        {
            const decoded = layers.map(layer =>
            {
                const { subresource } = this._GetLayerSurface(layer, mip);
                const surfaceDds = TextureFormatDDS.CreateSurfaceDDS(layer.buffer, layer.texture, subresource);
                return { rgba: CjsDdsFormat.read(surfaceDds, { emit: "rgba" }).data, subresource };
            });

            const { width, height } = decoded[0].subresource;

            gl.texImage3D(
                gl.TEXTURE_2D_ARRAY, mip, this._internalFormat,
                width, height, layers.length, 0,
                gl.RGBA, this._type,
                Tw2TextureArrayRes.ConcatBytes(decoded.map(d => d.rgba))
            );
        }
    }

    /**
     * Gets one layer's surface bytes for a mip
     * @param {{path:String, texture:Object}} layer
     * @param {Number} mip
     * @returns {{subresource:Object, bytes:Uint8Array}}
     */
    _GetLayerSurface(layer, mip)
    {
        const subresource = layer.texture.subresources.find(s => s.mip === mip && s.face === 0)
            || layer.texture.subresources.find(s => s.mip === mip);

        if (!subresource)
        {
            throw new ErrResourceFormatInvalid({
                format: "texturearray",
                reason: `Layer '${layer.path}' is missing mip ${mip}`
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
