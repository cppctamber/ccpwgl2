import { device, resMan } from "global";
import { num } from "math";
import {
    ErrResourceFormatInvalid,
    ErrResourceFormatUnsupported,
    ErrResourceFormatNotImplemented
} from "../Tw2Resource";
import { VolumeAtlas } from "../transforms/VolumeAtlas";

export const TextureFormatDDS =
{
    exts: [
        "dds"
    ],

    // =========================
    // DDS constants (localized)
    // =========================

    DDS_MAGIC: 0x20534444, // "DDS "
    DDS_MAGIC_SIZE: 4,
    DDS_HEADER_SIZE: 124,
    DDS_HEADER_DX10_SIZE: 20,

    // int32 header length (magic + header) = 128 bytes = 32 dwords
    DDS_HEADER_LENGTH_INT: 32,

    // Offsets into Int32Array(data, 0, 32)
    O_MAGIC: 0,
    O_SIZE: 1,
    O_FLAGS: 2,
    O_HEIGHT: 3,
    O_WIDTH: 4,
    O_MIPMAP_COUNT: 7,

    O_PF_FLAGS: 20,
    O_PF_FOURCC: 21,
    O_RGB_BPP: 22,
    O_R_MASK: 23,
    O_G_MASK: 24,
    O_B_MASK: 25,
    O_A_MASK: 26,

    O_CAPS2: 29,

    // caps2
    DDSCAPS2_CUBEMAP: 0x00000200,
    DDSCAPS2_VOLUME: 0x00200000,

    // flags
    DDSD_MIPMAPCOUNT: 0x00020000,

    // pixel format flags
    DDPF_ALPHAPIXELS: 0x00000001,
    DDPF_FOURCC: 0x00000004,
    DDPF_RGB: 0x00000040,
    DDPF_LUMINANCE: 0x00020000,

    // FourCC
    FOURCC_DXT1: 0x31545844, // "DXT1"
    FOURCC_DXT3: 0x33545844, // "DXT3"
    FOURCC_DXT5: 0x35545844, // "DXT5"
    FOURCC_ATI1: 0x31495441, // "ATI1"
    FOURCC_ATI2: 0x32495441, // "ATI2"
    FOURCC_DX10: 0x30315844, // "DX10"

    // DX10 header fields (uint32 indices)
    DX10_DXGI_FORMAT: 0,

    // DXGI subset names for readable errors
    DXGI_NAME: {
        71: "BC1_UNORM",
        72: "BC1_UNORM_SRGB",
        74: "BC2_UNORM",
        75: "BC2_UNORM_SRGB",
        77: "BC3_UNORM",
        78: "BC3_UNORM_SRGB",
        80: "BC4_UNORM",
        81: "BC4_SNORM",
        83: "BC5_UNORM",
        84: "BC5_SNORM",
        98: "BC7_UNORM",
        99: "BC7_UNORM_SRGB"
    },

    // =========================
    // Loader hook
    // =========================

    Load(res, path)
    {
        resMan.Fetch(path, "arraybuffer")
            .then(response =>
            {
                res.OnLoaded();
                resMan.Queue(res, response);
            })
            .catch(err => res.OnError(err));

        return true;
    },

    // =========================
    // Prepare hook (mutates res)
    // =========================

    Prepare(res, gl, arrayBuffer)
    {
        this.EnsureCompressedTextureExtensionsLoaded(gl);

        const info = this.ParseDDS(arrayBuffer, gl);

        // Volume DDS -> 2D RGBA atlas upload
        if (info.isVolume)
        {
            if (info.isCompressed)
            {
                throw new ErrResourceFormatUnsupported({
                    format: "DDS",
                    reason: "Compressed volume DDS not supported (needs BC decode)",
                    data: info
                });
            }

            // axis "x" makes 1024x32 for 32x32x32
            const atlas = VolumeAtlas.FromDDSUncompressed(arrayBuffer, info, {
                axis: "y",
                mipLevel: 0,
                headerIntCount: this.DDS_HEADER_LENGTH_INT
            });

            res._type = gl.UNSIGNED_BYTE;
            res._format = gl.RGBA;
            res._internalFormat = gl.RGBA;
            res._target = gl.TEXTURE_2D;

            res._mipCount = 1;
            res._hasMipMaps = false;
            res._isCube = false;

            res._width = atlas.width;
            res._height = atlas.height;
            res._isPowerOfTwo = ((res._width & (res._width - 1)) === 0) && ((res._height & (res._height - 1)) === 0);

            res._isVolumeAtlas = true;
            res._volumeAxis = atlas.axis;
            res._volumeSlices = atlas.slices;

            res.texture = gl.createTexture();
            gl.bindTexture(res._target, res.texture);

            const prevUnpack = gl.getParameter(gl.UNPACK_ALIGNMENT);
            gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);

            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, atlas.width, atlas.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, atlas.bytes);

            gl.pixelStorei(gl.UNPACK_ALIGNMENT, prevUnpack);
            gl.bindTexture(res._target, null);
            return;
        }

        if (!info.clientSupport)
        {
            throw new ErrResourceFormatUnsupported({
                format: "DDS",
                reason: info.name,
                data: info
            });
        }

        // Normal DDS (2D / cube)
        res._type = info.type ?? gl.UNSIGNED_BYTE;
        res._format = info.format;
        res._internalFormat = info.internalFormat;
        res._target = info.target;

        res._mipCount = info.mipmaps;
        res._hasMipMaps = res._mipCount > 1;

        res._isCube = info.isCube;
        res._width = info.width;
        res._height = info.height;
        res._isPowerOfTwo = info.isPowerOfTwo;

        res.texture = gl.createTexture();
        gl.bindTexture(res._target, res.texture);

        const prevUnpack = gl.getParameter(gl.UNPACK_ALIGNMENT);
        gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);

        let offset = info.dataOffset;

        for (let face = 0; face < info.faces; face++)
        {
            let w = info.width;
            let h = info.height;

            const target = info.isCube ? gl.TEXTURE_CUBE_MAP_POSITIVE_X + face : res._target;

            for (let mip = 0; mip < info.mipmaps; mip++)
            {
                if (info.isCompressed)
                {
                    const size = this.GetBCMipSize(w, h, info.blockBytes);
                    const bytes = new Uint8Array(arrayBuffer, offset, size);

                    gl.compressedTexImage2D(target, mip, info.internalFormat, w, h, 0, bytes);

                    offset += size;
                }
                else
                {
                    const { bytes, size } = this.ReadUncompressedDDSLevel(arrayBuffer, offset, w, h, info);

                    gl.texImage2D(
                        target,
                        mip,
                        info.internalFormat,
                        w,
                        h,
                        0,
                        info.format,
                        info.type ?? gl.UNSIGNED_BYTE,
                        bytes
                    );

                    offset += size;
                }

                w = Math.max(w >> 1, 1);
                h = Math.max(h >> 1, 1);
            }
        }

        gl.pixelStorei(gl.UNPACK_ALIGNMENT, prevUnpack);
        gl.bindTexture(res._target, null);
    },

    // =========================
    // Internal helpers
    // =========================

    EnsureCompressedTextureExtensionsLoaded(gl)
    {
        gl.getExtension("WEBGL_compressed_texture_s3tc");
        gl.getExtension("MOZ_WEBGL_compressed_texture_s3tc");
        gl.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");

        gl.getExtension("EXT_texture_compression_rgtc");
        gl.getExtension("EXT_texture_compression_bptc");
    },

    GetExt(gl, name, fallbacks = [])
    {
        if (device && typeof device.GetExtension === "function")
        {
            const got = device.GetExtension(name);
            if (got) return got;
        }

        let ext = gl.getExtension(name);
        if (ext) return ext;

        for (let i = 0; i < fallbacks.length; i++)
        {
            ext = gl.getExtension(fallbacks[i]);
            if (ext) return ext;
        }

        return null;
    },

    Int32ToFourCC(value)
    {
        return String.fromCharCode(
            value & 0xff,
            (value >> 8) & 0xff,
            (value >> 16) & 0xff,
            (value >> 24) & 0xff
        );
    },

    GetBCMipSize(w, h, blockBytes)
    {
        const bw = Math.max(1, (w + 3) >> 2);
        const bh = Math.max(1, (h + 3) >> 2);
        return bw * bh * blockBytes;
    },

    ReadUncompressedDDSLevel(arrayBuffer, offset, w, h, info)
    {
        // Luminance / Luminance-alpha
        if (info.isLuminance)
        {
            const bpp = info.hasAlpha ? 16 : 8;
            const size = w * h * (bpp >> 3);
            const bytes = new Uint8Array(arrayBuffer, offset, size);
            return { bytes, size };
        }

        const bpp = info.bpp ?? 32;
        const srcBppBytes = bpp >> 3;

        // 24bpp RGB
        if (bpp === 24)
        {
            const srcSize = w * h * 3;
            const src = new Uint8Array(arrayBuffer, offset, srcSize);

            const out = new Uint8Array(srcSize);
            for (let i = 0; i < w * h; i++)
            {
                const s = i * 3;
                out[s + 0] = src[s + info.rOffset];
                out[s + 1] = src[s + info.gOffset];
                out[s + 2] = src[s + info.bOffset];
            }

            return { bytes: out, size: srcSize };
        }

        // 32bpp (or other) -> RGBA8
        const srcSize = w * h * srcBppBytes;
        const src = new Uint8Array(arrayBuffer, offset, srcSize);

        const out = new Uint8Array(w * h * 4);
        const rO = info.rOffset ?? 0;
        const gO = info.gOffset ?? 1;
        const bO = info.bOffset ?? 2;
        const aO = info.aOffset ?? 3;

        for (let i = 0; i < w * h; i++)
        {
            const s = i * srcBppBytes;
            const d = i * 4;

            out[d + 0] = src[s + rO];
            out[d + 1] = src[s + gO];
            out[d + 2] = src[s + bO];
            out[d + 3] = (srcBppBytes >= 4) ? src[s + aO] : 255;
        }

        return { bytes: out, size: srcSize };
    },

    ParseDDS(data, gl)
    {
        if (!data?.byteLength)
        {
            throw new ErrResourceFormatInvalid({ format: "DDS", reason: "file is empty" });
        }

        const header = new Int32Array(data, 0, this.DDS_HEADER_LENGTH_INT);
        if (header[this.O_MAGIC] !== this.DDS_MAGIC)
        {
            throw new ErrResourceFormatInvalid({ format: "DDS", reason: "missing magic number" });
        }

        const width = header[this.O_WIDTH];
        const height = header[this.O_HEIGHT];
        const caps2 = header[this.O_CAPS2];

        const pfFlags = header[this.O_PF_FLAGS];
        const isFourCC = (pfFlags & this.DDPF_FOURCC) === this.DDPF_FOURCC;
        const isLuminance = (pfFlags & this.DDPF_LUMINANCE) === this.DDPF_LUMINANCE;
        const isRGB = (pfFlags & this.DDPF_RGB) === this.DDPF_RGB;
        const hasAlpha = (pfFlags & this.DDPF_ALPHAPIXELS) === this.DDPF_ALPHAPIXELS;

        const isCube = (caps2 & this.DDSCAPS2_CUBEMAP) === this.DDSCAPS2_CUBEMAP;
        const isVolume = (caps2 & this.DDSCAPS2_VOLUME) === this.DDSCAPS2_VOLUME;

        const hasMips = (header[this.O_FLAGS] & this.DDSD_MIPMAPCOUNT) !== 0;
        const mipmaps = hasMips ? Math.max(1, header[this.O_MIPMAP_COUNT]) : 1;

        const fourCC = header[this.O_PF_FOURCC];
        const fourCCStr = this.Int32ToFourCC(fourCC);

        const s3tc = this.GetExt(gl, "WEBGL_compressed_texture_s3tc", [
            "MOZ_WEBGL_compressed_texture_s3tc",
            "WEBKIT_WEBGL_compressed_texture_s3tc"
        ]);
        const rgtc = this.GetExt(gl, "EXT_texture_compression_rgtc");
        const bptc = this.GetExt(gl, "EXT_texture_compression_bptc");

        const info =
            {
                name: fourCCStr,
                width,
                height,
                isPowerOfTwo: ((width & (width - 1)) === 0) && ((height & (height - 1)) === 0),
                isCube,
                isVolume,
                faces: isCube ? 6 : 1,
                mipmaps,
                target: isCube ? gl.TEXTURE_CUBE_MAP : gl.TEXTURE_2D,

                isFourCC,
                isCompressed: false,
                internalFormat: null,
                format: null,
                type: null,
                blockBytes: 0,

                isLuminance,
                isRGB,
                hasAlpha,

                clientSupport: false,

                // pixel data begins after header (+ optional DX10 header)
                dataOffset: header[this.O_SIZE] + 4 // header size + magic
            };

        // Uncompressed DDS
        if (!isFourCC)
        {
            info.isCompressed = false;
            info.clientSupport = true;

            const bpp = header[this.O_RGB_BPP];
            info.bpp = bpp;
            info.type = gl.UNSIGNED_BYTE;

            if (isRGB)
            {
                info.name = (bpp === 24) ? "RGB" : "RGBA";
                info.format = (bpp === 24) ? gl.RGB : gl.RGBA;
                info.internalFormat = info.format;

                info.rOffset = num.getLongWordOrder(header[this.O_R_MASK]);
                info.gOffset = num.getLongWordOrder(header[this.O_G_MASK]);
                info.bOffset = num.getLongWordOrder(header[this.O_B_MASK]);
                if (bpp !== 24) info.aOffset = num.getLongWordOrder(header[this.O_A_MASK]);

                return info;
            }

            if (isLuminance)
            {
                info.name = hasAlpha ? "Luminance Alpha" : "Luminance";
                info.format = hasAlpha ? gl.LUMINANCE_ALPHA : gl.LUMINANCE;
                info.internalFormat = info.format;
                return info;
            }

            throw new ErrResourceFormatNotImplemented({
                format: "DDS",
                reason: "Non-FourCC DDS but not RGB/Luminance",
                data: info
            });
        }

        // Legacy compressed FourCCs
        if (fourCC === this.FOURCC_ATI1)
        {
            info.name = "ATI1/BC4_UNORM";
            info.isCompressed = true;
            info.blockBytes = 8;
            info.internalFormat = rgtc ? rgtc.COMPRESSED_RED_RGTC1_EXT : null;
            info.clientSupport = !!info.internalFormat;
            return info;
        }

        if (fourCC === this.FOURCC_ATI2)
        {
            info.name = "ATI2/BC5_UNORM";
            info.isCompressed = true;
            info.blockBytes = 16;
            info.internalFormat =
                rgtc?.COMPRESSED_RG_RGTC2_EXT ??
                rgtc?.COMPRESSED_RED_GREEN_RGTC2_EXT ??
                null;
            info.clientSupport = !!info.internalFormat;
            return info;
        }

        if (fourCC === this.FOURCC_DXT1 || fourCC === this.FOURCC_DXT3 || fourCC === this.FOURCC_DXT5)
        {
            info.isCompressed = true;

            if (fourCC === this.FOURCC_DXT1)
            {
                info.name = "DXT1/BC1";
                info.blockBytes = 8;
                info.internalFormat = s3tc ? s3tc.COMPRESSED_RGBA_S3TC_DXT1_EXT : null;
            }
            else if (fourCC === this.FOURCC_DXT3)
            {
                info.name = "DXT3/BC2";
                info.blockBytes = 16;
                info.internalFormat = s3tc ? s3tc.COMPRESSED_RGBA_S3TC_DXT3_EXT : null;
            }
            else
            {
                info.name = "DXT5/BC3";
                info.blockBytes = 16;
                info.internalFormat = s3tc ? s3tc.COMPRESSED_RGBA_S3TC_DXT5_EXT : null;
            }

            info.clientSupport = !!info.internalFormat;
            return info;
        }

        // DX10 header formats (DXGI)
        if (fourCCStr === "DX10")
        {
            const dx10Offset = this.DDS_MAGIC_SIZE + this.DDS_HEADER_SIZE;
            const dx10 = new Uint32Array(data, dx10Offset, this.DDS_HEADER_DX10_SIZE / 4);

            const dxgiFormat = dx10[this.DX10_DXGI_FORMAT];
            info.dxgiFormat = dxgiFormat;
            info.dxgiFormatName = this.DXGI_NAME[dxgiFormat] ?? `DXGI_${dxgiFormat}`;

            // DX10 header sits between DDS header and pixel data
            info.dataOffset += this.DDS_HEADER_DX10_SIZE;

            // Map key DXGI formats -> WebGL extension formats
            switch (dxgiFormat)
            {
                // BC1
                case 71:
                case 72:
                    info.name = dxgiFormat === 72 ? "DX10/BC1_UNORM_SRGB" : "DX10/BC1_UNORM";
                    info.isCompressed = true;
                    info.blockBytes = 8;
                    info.internalFormat = s3tc ? s3tc.COMPRESSED_RGBA_S3TC_DXT1_EXT : null;
                    info.clientSupport = !!info.internalFormat;
                    return info;

                // BC2
                case 74:
                case 75:
                    info.name = dxgiFormat === 75 ? "DX10/BC2_UNORM_SRGB" : "DX10/BC2_UNORM";
                    info.isCompressed = true;
                    info.blockBytes = 16;
                    info.internalFormat = s3tc ? s3tc.COMPRESSED_RGBA_S3TC_DXT3_EXT : null;
                    info.clientSupport = !!info.internalFormat;
                    return info;

                // BC3
                case 77:
                case 78:
                    info.name = dxgiFormat === 78 ? "DX10/BC3_UNORM_SRGB" : "DX10/BC3_UNORM";
                    info.isCompressed = true;
                    info.blockBytes = 16;
                    info.internalFormat = s3tc ? s3tc.COMPRESSED_RGBA_S3TC_DXT5_EXT : null;
                    info.clientSupport = !!info.internalFormat;
                    return info;

                // BC4
                case 80:
                case 81:
                    info.name = dxgiFormat === 81 ? "DX10/BC4_SNORM" : "DX10/BC4_UNORM";
                    info.isCompressed = true;
                    info.blockBytes = 8;
                    info.internalFormat =
                        dxgiFormat === 81
                            ? rgtc?.COMPRESSED_SIGNED_RED_RGTC1_EXT
                            : rgtc?.COMPRESSED_RED_RGTC1_EXT;
                    info.clientSupport = !!info.internalFormat;
                    return info;

                // BC5
                case 83:
                case 84:
                    info.name = dxgiFormat === 84 ? "DX10/BC5_SNORM" : "DX10/BC5_UNORM";
                    info.isCompressed = true;
                    info.blockBytes = 16;
                    info.internalFormat =
                        dxgiFormat === 84
                            ? rgtc?.COMPRESSED_SIGNED_RG_RGTC2_EXT
                            : (rgtc?.COMPRESSED_RG_RGTC2_EXT ?? rgtc?.COMPRESSED_RED_GREEN_RGTC2_EXT ?? null);
                    info.clientSupport = !!info.internalFormat;
                    return info;

                // BC7
                case 98:
                case 99:
                    info.name = dxgiFormat === 99 ? "DX10/BC7_UNORM_SRGB" : "DX10/BC7_UNORM";
                    info.isCompressed = true;
                    info.blockBytes = 16;
                    info.internalFormat =
                        dxgiFormat === 99
                            ? bptc?.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT
                            : bptc?.COMPRESSED_RGBA_BPTC_UNORM_EXT;
                    info.clientSupport = !!info.internalFormat;
                    return info;
            }

            throw new ErrResourceFormatUnsupported({
                format: "DDS",
                reason: `DX10 ${info.dxgiFormatName}`,
                info
            });
        }

        throw new ErrResourceFormatUnsupported({
            format: "DDS",
            reason: `FOURCC ${fourCCStr}`,
            info
        });
    }
};
