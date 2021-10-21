import { meta } from "utils";
import { num } from "math";
import { device, resMan, tw2 } from "global";
import { ErrHTTPRequest } from "../engine/Tw2ResMan";
import {
    Tw2Resource,
    ErrResourceFormatUnsupported,
    ErrResourceFormatInvalid,
    ErrResourceFormatNotImplemented
} from "./Tw2Resource";

import {
    DDPF_LUMINANCE,
    DDPF_RGB,
    DDS_HEADER_LENGTH_INT,
    DDS_HEADER_OFFSET_R_MASK,
    DDS_HEADER_OFFSET_G_MASK,
    DDS_HEADER_OFFSET_B_MASK,
    DDS_HEADER_OFFSET_A_MASK,
    DDS_HEADER_OFFSET_CAPS2,
    DDS_HEADER_OFFSET_DXGI_FORMAT,
    DDS_HEADER_OFFSET_FLAGS,
    DDS_HEADER_OFFSET_HEIGHT,
    DDS_HEADER_OFFSET_MAGIC,
    DDS_HEADER_OFFSET_MIPMAP_COUNT,
    DDS_HEADER_OFFSET_PF_FLAGS,
    DDS_HEADER_OFFSET_PF_FOURCC,
    DDS_HEADER_OFFSET_RGB_BPP,
    DDS_HEADER_OFFSET_SIZE,
    DDS_HEADER_OFFSET_WIDTH,
    DDS_MAGIC,
    DDSCAPS2_CUBEMAP,
    DDSCAPS2_VOLUME,
    DDSD_MIPMAPCOUNT,
    DXGI_FORMAT_B8G8R8X8_UNORM,
    DXGI_FORMAT_R16G16B16A16_FLOAT,
    DXGI_FORMAT_R32G32B32A32_FLOAT,
    FOURCC_ATI1,
    FOURCC_ATI2,
    FOURCC_D3DFMT_R16G16B16A16F,
    FOURCC_D3DFMT_R32G32B32A32F,
    FOURCC_DXT1,
    FOURCC_DXT10,
    FOURCC_DXT3,
    FOURCC_DXT5,
    DDPF_FOURCC,
    DDPF_ALPHAPIXELS
} from "constant";


@meta.type("Tw2TextureRes")
export class Tw2TextureRes extends Tw2Resource
{

    texture = null;

    /**
     * Canvas attachment
     * @type {null|Tw2TextureResHTMLAttachment}
     */
    attachment = null;

    _currentSampler = 0;
    _isAttached = false;
    _extension = "";    
    _width = 0;
    _height = 0;
    _type = null;
    _format = null;
    _internalFormat = null;
    _target = null;
    _hasMipMaps = false;
    _isCube = false;
    _isPowerOfTwo = false;
    _useNoMipFilter = false;


    /**
     * Deletes gl objects
     */
    DeleteGL()
    {
        if (this.texture)
        {
            device.gl.deleteTexture(this.texture);
            this.texture = null;
        }
    }

    /**
     * Prepares the resource
     * @param {*|Image|arrayBuffer} data
     */
    Prepare(data)
    {
        const gl = device.gl;
        const format = "ccpGLFormat" in data ? data["ccpGLFormat"] : gl.RGBA;

        this.DeleteGL();

        switch (this._extension)
        {
            case "cube":
                this._target = gl.TEXTURE_CUBE_MAP;
                this._format = format;
                this._type = gl.UNSIGNED_BYTE;
                this._isPowerOfTwo = Tw2TextureRes.IsPowerOfTwo(data.height);
                this._width = this._height = data.height;
                this.texture = gl.createTexture();

                gl.bindTexture(this._target, this.texture);

                const canvas = document.createElement("canvas");
                canvas.width = canvas.height = data.height;
                const ctx = canvas.getContext("2d");
                for (let j = 0; j < 6; ++j)
                {
                    ctx.drawImage(data, j * canvas.width, 0, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);
                    gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + j, 0, this._format, this._format, this._type, canvas);
                }
                if (this._isPowerOfTwo || device.glVersion > 1)
                {
                    gl.generateMipmap(this._target);
                }
                gl.bindTexture(this._target, null);
                this._hasMipMaps = true;
                break;

            case "png":
                this._target = gl.TEXTURE_2D;
                this._format = format;
                this._type = gl.UNSIGNED_BYTE;
                this._isPowerOfTwo = Tw2TextureRes.IsPowerOfTwo(data.width, data.height);
                this.texture = gl.createTexture();

                gl.bindTexture(this._target, this.texture);
                gl.texImage2D(this._target, 0, this._format, this._format, this._type, data);
                if (this._isPowerOfTwo || device.glVersion > 1)
                {
                    gl.generateMipmap(this._target);
                    this._hasMipMaps = true;
                }
                gl.bindTexture(this._target, null);
                this._width = data.width;
                this._height = data.height;
                break;

                /**

             DDS methods based off work by Brandon Jones and Babylon
             -----------------------------------------------------------------------
             Copyright (c) 2012 Brandon Jones

             **/

            case "dds":
                const info = Tw2TextureRes.GetDDSInfo(data);
                info.filePath = this.path;

                let {
                    name,
                    fourCC,
                    isRGB,
                    isLuminance,
                    isCube,
                    blockBytes,
                    dataOffset,
                    faces,
                    isCompressed,
                    clientSupport,
                    width,
                    height,
                    mipmaps
                } = info;

                if (!clientSupport)
                {
                    throw new ErrResourceFormatUnsupported({
                        format: "DDS",
                        reason: name,
                        data: info
                    });
                }

                // Don't support anything else yet
                if (!isCompressed && !isRGB && !isLuminance)
                {
                    throw new ErrResourceFormatNotImplemented({
                        format: "DDS",
                        reason: name,
                        data: info
                    });
                }

                // Temporarily output uncompressed rgb/rgba dds info
                if (isRGB || isLuminance || fourCC === FOURCC_ATI1 || fourCC === FOURCC_ATI2)
                {
                    tw2.Debug({
                        name: "Tw2TextureRes",
                        message: `Partial or incomplete support for ${name}: ${this.path}`,
                        data: info
                    });
                }

                if (device.glVersion === 1 && !info.isPowerOfTwo)
                {
                    mipmaps = 1;

                    tw2.Debug({
                        name: "Tw2TextureRes",
                        message: `Texture not power of 2: ${this.path}`,
                        data: info
                    });
                }


                this._type = info.type;
                this._format = info.format;
                this._internalFormat = info.internalFormat;
                this._target = info.target;

                this._mipCount = mipmaps;
                this._hasMipMaps = this._mipCount > 1;
                this._isCube = isCube;
                this._isPowerOfTwo = info.isPowerOfTwo;
                this._width = width;
                this._height = height;

                // Todo: Fix mip generation
                this._useNoMipFilter = true;

                this.texture = gl.createTexture();
                gl.bindTexture(this._target, this.texture);

                let unpackAlignment = gl.getParameter(gl.UNPACK_ALIGNMENT);

                for (let face = 0; face < faces; face++)
                {
                    let w = width,
                        h = height,
                        o = dataOffset,
                        t = isCube ? gl.TEXTURE_CUBE_MAP_POSITIVE_X + face : this._target,
                        dataLength,
                        byteArray;

                    for (let mip = 0; mip < this._mipCount; mip++)
                    {
                        if (isCompressed)
                        {
                            dataLength = Math.max(4, w) / 4 * Math.max(4, h) / 4 * blockBytes;
                            byteArray = new Uint8Array(data, o, dataLength);
                            gl.compressedTexImage2D(t, mip, this._internalFormat, w, h, 0, byteArray);
                            o += dataLength;
                        }
                        else if (isLuminance)
                        {
                            unpackAlignment = 1;

                            let unpaddedRowSize = w,
                                paddedRowSize = Math.floor((w + unpackAlignment - 1) / unpackAlignment) * unpackAlignment;

                            dataLength = paddedRowSize * (height - 1) + unpaddedRowSize;

                            gl.pixelStorei(gl.UNPACK_ALIGNMENT, unpackAlignment);
                            byteArray = Tw2TextureRes.GetLuminanceArrayBuffer(w, h, data.byteOffset + o, dataLength, data.buffer);
                            gl.texImage2D(t, mip, this._internalFormat, w, h, 0, this._format, this._type, byteArray);
                            o += dataLength;
                        }
                        else//if (isRGB)
                        {
                            const { rOffset, bOffset, gOffset, aOffset, bpp } = info;

                            unpackAlignment = 1;
                            gl.pixelStorei(gl.UNPACK_ALIGNMENT, unpackAlignment);

                            if (format === gl.RGB)
                            {
                                dataLength = w * h * 3;
                                byteArray = Tw2TextureRes.GetRGBArrayBuffer(w, h, data.byteOffset + o, dataLength, data.buffer, rOffset, gOffset, bOffset);
                            }
                            else
                            {
                                dataLength = w * h * 4;
                                byteArray = Tw2TextureRes.GetRGBAArrayBuffer(w, h, data.byteOffset + o, dataLength, data.buffer, rOffset, gOffset, bOffset, aOffset);
                            }

                            gl.texImage2D(t, mip, this._internalFormat, w, h, 0, this._format, this._type, byteArray);
                            o += (w * h * (bpp / 8));
                        }

                        w = Math.max(w >> 1, 1);
                        h = Math.max(h >> 1, 1);
                    }
                }

                //gl.texParameteri(this._target, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                //gl.texParameteri(this._target, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
                gl.bindTexture(this._target, null);
                break;

            default:
                throw new ErrResourceFormatUnsupported({ format: this._extension });
        }

        this._isAttached = false;
        this.OnPrepared();
    }

    /**
     *
     * @param sampler
     * @param slices
     * @constructor
     */
    Bind(sampler, slices)
    {
        const
            d = device,
            { gl } = device;

        this.KeepAlive();
        
        if (this.attachment)
        {
            this.attachment.UpdateTextureRes(this);
        }

        // Try to guess
        if (this._target === null)
        {
            this._target = sampler.samplerType;
            this._isCube = sampler.samplerType === gl.TEXTURE_CUBE_MAP;
        }
        else if (sampler.samplerType !== this._target)
        {
            return;
        }

        if (!this.texture)
        {
            const texture = this._target === gl.TEXTURE_2D ? d.GetFallbackTexture() : d.GetFallbackCubeMap();
            gl.bindTexture(this._target, texture);
            return;
        }

        if (sampler.isVolume)
        {
            gl.uniform1f(slices, this._height / this._width);
        }

        gl.bindTexture(this._target, this.texture);
        if (sampler.hash === null || sampler.hash !== this._currentSampler)
        {
            sampler.Apply(d, this._hasMipMaps, this._useNoMipFilter);
            this._currentSampler = sampler.hash;
        }
    }

    /**
     * Clears meta info
     */
    _ClearMeta()
    {
        this._extension = null;
        this._isAttached = false;
        this._isCube = null;
        this._target = null;
        this._type = null;
        this._internalFormat = null;
        this._mipCount = null;
        this._hasMipMaps = null;
        this._useNoMipFilter = null;
    }


    /**
     * An optional method resources can have that allows them to take over loading their resources
     * @param {String} path - texture resource path
     * @param {String} extension - the texture extension
     * @returns {Boolean} returns true to tell the resMan not to handle http requests
     */
    DoCustomLoad(path, extension)
    {
        switch (extension)
        {
            case "cube":
                this._extension = extension;
                this._isCube = true;
                path = path.substr(0, path.length - 5) + ".png";
                break;

            case "qube":
                this._extension = "cube";
                path = path.replace(".qube", ".cube");
                this._isCube = true;
                break;

            case "png":
                this._extension = extension;
                this._isCube = false;
                break;

            case "dds":
                this._extension = extension;
                resMan.Fetch(Tw2TextureRes.AddMipLevelSkipCount(path), "arraybuffer")
                    .then(response =>
                    {
                        this.OnLoaded();
                        resMan.Queue(this, response);
                    })
                    .catch(err =>
                    {
                        this.OnError(err);
                    });
                return true;

            default:
                throw new ErrResourceFormatUnsupported({ format: extension });
        }

        resMan.AddPendingLoad(path);
        const image = new Image();
        image.crossOrigin = "anonymous";

        /**
         * Fires on errors
         */
        image.onerror = () =>
        {
            resMan.RemovePendingLoad(path);
            this.OnError(new ErrHTTPRequest({ path }));
        };

        /**
         * Fires when loaded
         */
        image.onload = () =>
        {
            resMan.RemovePendingLoad(path);
            resMan.Queue(this, image);
            this.OnLoaded();
        };

        image.src = Tw2TextureRes.AddMipLevelSkipCount(path);
        return true;
    }

    /**
     * Unloads the texture from memory
     * @param {*} [log]
     * @returns {Boolean}
     */
    Unload(log)
    {
        this.DeleteGL();
        this._ClearMeta();
        this.OnUnloaded(log);
        return true;
    }

    /**
     * Attaches a texture
     * @param {WebGLTexture} texture
     * @param {String} [path=""]
     */
    Attach(texture, path = "")
    {
        this.DeleteGL();
        this._ClearMeta();
        this.path = path;
        this.texture = texture;
        this._isAttached = true;
        this.OnLoaded({ hide: true, path: "attachment" });
        this.OnPrepared({ hide: true, path: "attachment" });
    }

    /**
     * Reloads the texture
     * @param {eventLog} [eventLog]
     */
    Reload(eventLog)
    {
        if (!this._isAttached)
        {
            return super.Reload(eventLog);
        }
    }

    /**
     * Finds out if a number is to the power of 2
     * @param args
     * @returns {Boolean}
     */
    static IsPowerOfTwo(...args)
    {
        for (let i = 0; i < args.length; i++)
        {
            if ((args[i] & (args[i] - 1)) !== 0)
            {
                return false;
            }
        }
        return true;
    }

    /**
     * Adds mip levels to a path
     * @param {String} path
     * @returns {String}}
     */
    static AddMipLevelSkipCount(path)
    {
        const d = device;
        if (d.mipLevelSkipCount > 0)
        {
            const index = path.lastIndexOf(".");
            if (index >= 0)
            {
                path = path.substr(0, index - 2) + "." + d.mipLevelSkipCount.toString() + path.substr(index);
            }
        }
        return path;
    }

    /**
     * Converts an int32 into FourCC format
     * @param {Number} value
     * @returns {String}
     */
    static Int32ToFourCC(value)
    {
        return String.fromCharCode(value & 0xff, (value >> 8) & 0xff, (value >> 16) & 0xff, (value >> 24) & 0xff);
    }

    /**
     * Creates an image from a 2d texture
     * @param texture
     * @param width
     * @param height
     * @param format
     * @returns {HTMLImageElement}
     * @constructor
     */
    static CreateImageFrom2DTexture(texture, width = 512, height = 512, format = device.gl.RGBA)
    {
        const gl = device.gl;
        const fb = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
        const data = new Uint8Array(width * height * 4);
        gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, data);
        gl.deleteFramebuffer(fb);

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d");
        const imageData = context.createImageData(width, height);
        imageData.data.set(data);
        context.putImageData(imageData, 0, 0);

        const img = new Image();
        img.src = canvas.toDataURL();
        return img;
    }

    /**
     * Gets dds info for debugging
     * @param {arrayBuffer} data
     * @return {Object}
     */
    static GetDDSInfo(data)
    {
        // Ensure we have data to work with
        if (!data.byteLength)
        {
            throw new ErrResourceFormatInvalid({
                format: "DDS",
                reason: "file is empty"
            });
        }

        let header = new Int32Array(data, 0, DDS_HEADER_LENGTH_INT);

        if (header[DDS_HEADER_OFFSET_MAGIC] !== DDS_MAGIC)
        {
            throw new ErrResourceFormatInvalid({
                format: "DDS",
                reason: "missing magic number"
            });
        }

        let { gl } = device;

        let fourCC = header[DDS_HEADER_OFFSET_PF_FOURCC],
            headerExt = new Int32Array(data.buffer, data.byteOffset, DDS_HEADER_LENGTH_INT + 4),
            isFourCC = header[DDS_HEADER_OFFSET_PF_FLAGS && DDPF_FOURCC] === DDPF_FOURCC,
            dxgi = isFourCC && fourCC === FOURCC_DXT10 ? headerExt[DDS_HEADER_OFFSET_DXGI_FORMAT] : 0,
            isCube = (header[DDS_HEADER_OFFSET_CAPS2] & DDSCAPS2_CUBEMAP) === DDSCAPS2_CUBEMAP,
            s3tc = device.GetExtension("compressed_texture_s3tc"),
            rgtc1 = device.GetExtension("EXT_texture_compression_rgtc"),
            width = header[DDS_HEADER_OFFSET_WIDTH],
            height = header[DDS_HEADER_OFFSET_HEIGHT],
            bpp = header[DDS_HEADER_OFFSET_RGB_BPP],
            hasMips = header[DDS_HEADER_OFFSET_FLAGS] & DDSD_MIPMAPCOUNT;

        const info = {
            fourCC,
            width,
            height,
            isFourCC,
            isCube,
            name: Tw2TextureRes.Int32ToFourCC(fourCC),
            isPowerOfTwo: Tw2TextureRes.IsPowerOfTwo(width, height),
            isLuminance: (header[DDS_HEADER_OFFSET_PF_FLAGS] & DDPF_LUMINANCE) === DDPF_LUMINANCE,
            hasAlpha: (header[DDS_HEADER_OFFSET_PF_FLAGS] & DDPF_ALPHAPIXELS) === DDPF_ALPHAPIXELS,
            isRGB: (header[DDS_HEADER_OFFSET_PF_FLAGS] & DDPF_RGB) === DDPF_RGB,
            isVolume: (header[DDS_HEADER_OFFSET_CAPS2]) & DDSCAPS2_VOLUME === DDSCAPS2_VOLUME,
            dataOffset: header[DDS_HEADER_OFFSET_SIZE] + 4,
            mipmaps: hasMips ? Math.max(1, header[DDS_HEADER_OFFSET_MIPMAP_COUNT]) : 1,
            format: null,
            type: null,
            internalFormat: null,
            target: isCube ? gl.TEXTURE_CUBE_MAP : gl.TEXTURE_2D,  // TODO: Check for 3d textures or 2d texture array
            faces: isCube ? 6 : 1,
            isCompressed: false,
            clientSupport: false,
        };

        switch (info.fourCC)
        {
            case FOURCC_DXT1: // BC1
                info.blockBytes = 8;
                info.internalFormat = s3tc ? s3tc.COMPRESSED_RGBA_S3TC_DXT1_EXT : null;
                info.clientSupport = !!info.internalFormat;
                info.isCompressed = true;
                break;

            case FOURCC_DXT3: // BC2
                info.blockBytes = 16;
                info.internalFormat = s3tc ? s3tc.COMPRESSED_RGBA_S3TC_DXT3_EXT : null;
                info.clientSupport = !!info.internalFormat;
                info.isCompressed = true;
                break;

            case FOURCC_DXT5: // BC3
                info.blockBytes = 16;
                info.internalFormat = s3tc ? s3tc.COMPRESSED_RGBA_S3TC_DXT5_EXT : null;
                info.clientSupport = !!info.internalFormat;
                info.isCompressed = true;
                break;

            case FOURCC_ATI1: // BC4
                info.blockBytes = 8;
                info.internalFormat = rgtc1 ? rgtc1["COMPRESSED_RED_RGTC1_EXT"] : null;
                info.clientSupport = !!info.internalFormat;
                info.isCompressed = true;
                info.format = gl.UNSIGNED_BYTE;
                info.format = gl.RED;
                break;

            case FOURCC_ATI2: // BC5
                info.blockBytes = 16;
                info.internalFormat = rgtc1 ? rgtc1["COMPRESSED_RED_GREEN_RGTC2_EXT"] : null;
                info.clientSupport = !!info.internalFormat;
                info.isCompressed = true;
                info.format = gl.UNSIGNED_BYTE;
                info.internalFormat = gl.RG;
                break;

            case FOURCC_D3DFMT_R16G16B16A16F:
                info.type = gl.HALF_FLOAT;
                info.format = gl.RGBA;
                info.clientSupport = true;
                break;

            case FOURCC_D3DFMT_R32G32B32A32F:
                info.type = gl.FLOAT;
                info.format = gl.RGBA;
                info.clientSupport = true;
                break;

            case FOURCC_DXT10:
                info.dataOffset += 5 * 4;
                info.dxgiFormat = dxgi;
                info.clientSupport = true;

                switch (dxgi)
                {
                    case DXGI_FORMAT_R16G16B16A16_FLOAT:
                        info.type = gl.HALF_FLOAT;
                        info.format = gl.RGBA;
                        break;

                    case DXGI_FORMAT_R32G32B32A32_FLOAT:
                        info.type = gl.FLOAT;
                        info.format = gl.RGBA;
                        break;

                    case DXGI_FORMAT_B8G8R8X8_UNORM:
                        info.isFourCC = false;
                        info.isRGB = true;
                        bpp = 32;
                        break;

                    default:
                        throw new ErrResourceFormatUnsupported({
                            format: "DDS",
                            reason: `DX10 ${dxgi}`,
                            info
                        });
                }
                break;

            default:
                if (info.isRGB)
                {
                    info.bpp = bpp;
                    info.type = gl.UNSIGNED_BYTE;
                    info.clientSupport = true;
                    info.isUncompressedRGBA = true;

                    info.rOffset = num.getLongWordOrder(header[DDS_HEADER_OFFSET_R_MASK]);
                    info.gOffset = num.getLongWordOrder(header[DDS_HEADER_OFFSET_G_MASK]);
                    info.bOffset = num.getLongWordOrder(header[DDS_HEADER_OFFSET_B_MASK]);

                    if (bpp === 24)
                    {
                        info.name = "RGB";
                        info.format = gl.RGB;
                        info.internalFormat = device.glVersion === 1 ? gl.RGB : gl.RGB8; // RGB565, SRGB8
                    }
                    else
                    {
                        info.name = "RGBA";
                        info.format = gl.RGBA;
                        info.internalFormat = device.glVersion === 1 ? gl.RGBA : gl.RGBA8; // RGB5_A1, RGBA4, SRGB8_ALPHA8
                        info.aOffset = num.getLongWordOrder(header[DDS_HEADER_OFFSET_A_MASK]);
                    }
                    break;
                }

                if (info.isLuminance)
                {
                    if (info.hasAlpha)
                    {
                        info.name = "Luminance Alpha";
                        info.type = gl.UNSIGNED_BYTE;
                        info.format = gl.LUMINANCE_ALPHA;
                        info.internalFormat = gl.LUMINANCE_ALPHA;
                    }
                    else
                    {
                        info.name = "Luminance";
                        info.type = gl.UNSIGNED_BYTE;
                        info.format = gl.LUMINANCE;
                        info.internalFormat = gl.LUMINANCE;
                    }
                    info.clientSupport = true;
                    break;
                }

                console.dir(info);
                const code = Tw2TextureRes.Int32ToFourCC(info.fourCC);
                throw new ErrResourceFormatUnsupported({
                    format: "DDS",
                    reason: `FOURCC ${code}`,
                    info
                });
        }

        // TODO: Handle fourCC which aren't compressed
        if (info.isFourCC && !info.isCompressed)
        {
            // 128 or 64 without half float
            // info.type = gl.FLOAT;
            // 64 with half float
            // info.type = gl.HALF_FLOAT;
        }

        return info;
    }

    static GetLuminanceArrayBuffer(width, height, dataOffset, dataLength, arrayBuffer)
    {
        const
            byteArray = new Uint8Array(dataLength),
            srcData = new Uint8Array(arrayBuffer, dataOffset);

        let index = 0;
        for (let y = 0; y < height; y++)
        {
            for (let x = 0; x < width; x++)
            {
                let srcPos = (x + y * width);
                byteArray[index] = srcData[srcPos];
                index++;
            }
        }

        return byteArray;
    }

    /**
     * Gets a byte array from an rgb array buffer
     * @author BabylonJS
     * @param width
     * @param height
     * @param dataOffset
     * @param dataLength
     * @param arrayBuffer
     * @param rOffset
     * @param gOffset
     * @param bOffset
     * @return {Uint8Array}
     */
    static GetRGBArrayBuffer(width, height, dataOffset, dataLength, arrayBuffer, rOffset, gOffset, bOffset)
    {
        const
            byteArray = new Uint8Array(dataLength),
            srcData = new Uint8Array(arrayBuffer, dataOffset, dataLength);

        let index = 0;
        for (let y = 0; y < height; y++)
        {
            for (let x = 0; x < width; x++)
            {
                const srcPos = (x + y * width) * 3;
                byteArray[index] = srcData[srcPos + rOffset];
                byteArray[index + 1] = srcData[srcPos + gOffset];
                byteArray[index + 2] = srcData[srcPos + bOffset];
                index += 3;
            }
        }

        return byteArray;
    }

    /**
     * Gets a byte array from an rgb array buffer
     * @author BabylonJS
     * @param width
     * @param height
     * @param dataOffset
     * @param dataLength
     * @param arrayBuffer
     * @param rOffset
     * @param gOffset
     * @param bOffset
     * @param aOffset
     * @return {Uint8Array}
     */
    static GetRGBAArrayBuffer(width, height, dataOffset, dataLength, arrayBuffer, rOffset, gOffset, bOffset, aOffset)
    {
        const
            byteArray = new Uint8Array(dataLength),
            srcData = new Uint8Array(arrayBuffer, dataOffset, dataLength);

        let index = 0;
        for (let y = 0; y < height; y++)
        {
            for (let x = 0; x < width; x++)
            {
                const srcPos = (x + y * width) * 4;
                byteArray[index] = srcData[srcPos + rOffset];
                byteArray[index + 1] = srcData[srcPos + gOffset];
                byteArray[index + 2] = srcData[srcPos + bOffset];
                byteArray[index + 3] = srcData[srcPos + aOffset];
                index += 4;
            }
        }

        return byteArray;
    }
}
