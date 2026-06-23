import { device, resMan } from "global";
import { num } from "math";
import {
    ErrResourceFormatInvalid,
    ErrResourceFormatUnsupported
} from "../Tw2Resource";
import { VolumeAtlas } from "../transforms/VolumeAtlas";


const DDS =
{
    MAGIC: 0x20534444,
    MAGIC_SIZE: 4,
    HEADER_SIZE: 124,
    HEADER_DX10_SIZE: 20,
    HEADER_LENGTH_INT: 32,

    OFFSET_SIZE: 4,
    OFFSET_FLAGS: 8,
    OFFSET_HEIGHT: 12,
    OFFSET_WIDTH: 16,
    OFFSET_DEPTH: 24,
    OFFSET_MIPMAP_COUNT: 28,
    OFFSET_PF_FLAGS: 80,
    OFFSET_PF_FOURCC: 84,
    OFFSET_RGB_BPP: 88,
    OFFSET_R_MASK: 92,
    OFFSET_G_MASK: 96,
    OFFSET_B_MASK: 100,
    OFFSET_A_MASK: 104,
    OFFSET_CAPS2: 112,

    OFFSET_DX10_FORMAT: 128
};

const DDSD_MIPMAPCOUNT = 0x00020000;

const DDSCAPS2_CUBEMAP = 0x00000200;
const DDSCAPS2_VOLUME = 0x00200000;

const DDPF_ALPHAPIXELS = 0x00000001;
const DDPF_FOURCC = 0x00000004;
const DDPF_RGB = 0x00000040;
const DDPF_LUMINANCE = 0x00020000;

const FOURCC =
{
    DXT1: 0x31545844,
    DXT3: 0x33545844,
    DXT5: 0x35545844,
    ATI1: 0x31495441,
    ATI2: 0x32495441,
    DX10: 0x30315844
};

const DXGI =
{
    R8_UNORM: 61,
    R8G8_UNORM: 49,
    R8G8B8A8_UNORM: 28,
    R8G8B8A8_UNORM_SRGB: 29,
    B8G8R8A8_UNORM: 87,
    B8G8R8X8_UNORM: 88,
    B8G8R8A8_UNORM_SRGB: 91,
    B8G8R8X8_UNORM_SRGB: 93,

    BC1_UNORM: 71,
    BC1_UNORM_SRGB: 72,
    BC2_UNORM: 74,
    BC2_UNORM_SRGB: 75,
    BC3_UNORM: 77,
    BC3_UNORM_SRGB: 78,
    BC4_UNORM: 80,
    BC4_SNORM: 81,
    BC5_UNORM: 83,
    BC5_SNORM: 84,
    BC7_UNORM: 98,
    BC7_UNORM_SRGB: 99
};

const DXGI_NAME =
{
    [DXGI.R8_UNORM]: "R8_UNORM",
    [DXGI.R8G8_UNORM]: "R8G8_UNORM",
    [DXGI.R8G8B8A8_UNORM]: "R8G8B8A8_UNORM",
    [DXGI.R8G8B8A8_UNORM_SRGB]: "R8G8B8A8_UNORM_SRGB",
    [DXGI.B8G8R8A8_UNORM]: "B8G8R8A8_UNORM",
    [DXGI.B8G8R8X8_UNORM]: "B8G8R8X8_UNORM",
    [DXGI.B8G8R8A8_UNORM_SRGB]: "B8G8R8A8_UNORM_SRGB",
    [DXGI.B8G8R8X8_UNORM_SRGB]: "B8G8R8X8_UNORM_SRGB",

    [DXGI.BC1_UNORM]: "BC1_UNORM",
    [DXGI.BC1_UNORM_SRGB]: "BC1_UNORM_SRGB",
    [DXGI.BC2_UNORM]: "BC2_UNORM",
    [DXGI.BC2_UNORM_SRGB]: "BC2_UNORM_SRGB",
    [DXGI.BC3_UNORM]: "BC3_UNORM",
    [DXGI.BC3_UNORM_SRGB]: "BC3_UNORM_SRGB",
    [DXGI.BC4_UNORM]: "BC4_UNORM",
    [DXGI.BC4_SNORM]: "BC4_SNORM",
    [DXGI.BC5_UNORM]: "BC5_UNORM",
    [DXGI.BC5_SNORM]: "BC5_SNORM",
    [DXGI.BC7_UNORM]: "BC7_UNORM",
    [DXGI.BC7_UNORM_SRGB]: "BC7_UNORM_SRGB"
};

const GL_COMPRESSED =
{
    COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT: 0x8C4D,
    COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT: 0x8C4E,
    COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT: 0x8C4F,

    COMPRESSED_RED_RGTC1_EXT: 0x8DBB,
    COMPRESSED_SIGNED_RED_RGTC1_EXT: 0x8DBC,
    COMPRESSED_RG_RGTC2_EXT: 0x8DBD,
    COMPRESSED_SIGNED_RG_RGTC2_EXT: 0x8DBE,

    COMPRESSED_RGBA_BPTC_UNORM_EXT: 0x8E8C,
    COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT: 0x8E8D
};


export const TextureFormatDDS =
{
    formatName: "dds",

    exts: [ "dds" ],

    DDS_HEADER_LENGTH_INT: DDS.HEADER_LENGTH_INT,

    Load(res, path)
    {
        resMan.FetchRaw(path, "arraybuffer")
            .then(response =>
            {
                res.OnLoaded();
                resMan.Queue(res, response);
            })
            .catch(err => res.OnError(err));

        return true;
    },

    GetSupport(gl)
    {
        if (!gl)
        {
            return {
                supported: false,
                partial: true,
                declared: false,
                verified: false,
                pending: true,
                fallback: "png",
                formats: {},
                reason: "webgl_not_initialized"
            };
        }

        const
            extensions = this.GetExtensions(gl),
            hasS3TC = !!extensions.s3tc,
            hasS3TCSRGB = !!extensions.s3tcSRGB,
            hasRGTC = !!extensions.rgtc,
            hasBPTC = !!extensions.bptc;

        return {
            supported: true,
            partial: !(hasS3TC && hasRGTC && hasBPTC),
            declared: true,
            verified: false,
            fallback: "png",
            formats: {
                uncompressed: { declared: true, verified: true },
                dx10Uncompressed: { declared: true, verified: true },
                bc1: { declared: hasS3TC, verified: false },
                bc1SRGB: { declared: hasS3TC && hasS3TCSRGB, verified: false },
                bc2: { declared: hasS3TC, verified: false },
                bc2SRGB: { declared: hasS3TC && hasS3TCSRGB, verified: false },
                bc3: { declared: hasS3TC, verified: false },
                bc3SRGB: { declared: hasS3TC && hasS3TCSRGB, verified: false },
                bc4: { declared: hasRGTC, verified: false },
                bc5: { declared: hasRGTC, verified: false },
                bc7: { declared: hasBPTC, verified: false },
                bc7SRGB: { declared: hasBPTC, verified: false }
            }
        };
    },

    Prepare(res, gl, arrayBuffer)
    {
        const info = this.ParseDDS(arrayBuffer, gl);
        if (device.tw2.GetDebugMode()) res._debugInfo = this.GetDebugInfo(res, info);

        if (info.isVolume)
        {
            this.PrepareVolumeAtlas(res, gl, arrayBuffer, info);
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

        this.AssignResourceInfo(res, gl, info);
        this.UploadTexture(res, gl, arrayBuffer, info);
    },

    PrepareVolumeAtlas(res, gl, arrayBuffer, info)
    {
        if (info.isCompressed)
        {
            throw new ErrResourceFormatUnsupported({
                format: "DDS",
                reason: "Compressed volume DDS not supported",
                data: info
            });
        }

        const atlas = VolumeAtlas.FromDDSUncompressed(arrayBuffer, info, {
            axis: "y",
            mipLevel: 0,
            headerIntCount: DDS.HEADER_LENGTH_INT
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
        res._isPowerOfTwo = res.constructor.IsPowerOfTwo(atlas.width, atlas.height);

        res._isVolumeAtlas = true;
        res._volumeAxis = atlas.axis;
        res._volumeSlices = atlas.slices;

        if (res._debugInfo)
        {
            res._debugInfo.output = {
                target: "TEXTURE_2D",
                type: "volumeAtlas",
                axis: atlas.axis,
                slices: atlas.slices,
                width: atlas.width,
                height: atlas.height
            };
        }

        res.texture = gl.createTexture();
        gl.bindTexture(res._target, res.texture);

        const prevUnpack = gl.getParameter(gl.UNPACK_ALIGNMENT);
        gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, atlas.width, atlas.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, atlas.bytes);
        gl.pixelStorei(gl.UNPACK_ALIGNMENT, prevUnpack);

        gl.bindTexture(res._target, null);
    },

    AssignResourceInfo(res, gl, info)
    {
        res._type = info.type ?? gl.UNSIGNED_BYTE;
        res._format = info.format;
        res._internalFormat = info.internalFormat;
        res._target = info.target;

        res._mipCount = info.mipmaps;
        res._hasMipMaps = info.mipmaps > 1;

        res._isCube = info.isCube;
        res._width = info.width;
        res._height = info.height;
        res._isPowerOfTwo = info.isPowerOfTwo;
        res._isSRGB = !!info.isSRGB;
    },

    GetDebugInfo(res, info)
    {
        return {
            source: {
                container: "dds",
                path: res.path,
                extension: res._extension
            },
            format: {
                name: info.name,
                dxgiFormat: info.dxgiFormat ?? null,
                dxgiFormatName: info.dxgiFormatName ?? null,
                isFourCC: info.isFourCC,
                isCompressed: info.isCompressed,
                isSRGB: info.isSRGB,
                isRGB: info.isRGB,
                isLuminance: info.isLuminance,
                hasAlpha: info.hasAlpha,
                bpp: info.bpp,
                blockBytes: info.blockBytes
            },
            layout: {
                width: info.width,
                height: info.height,
                depth: info.depth,
                faces: info.faces,
                mipmaps: info.mipmaps,
                isCube: info.isCube,
                isVolume: info.isVolume,
                dataOffset: info.dataOffset
            },
            gl: {
                target: info.target,
                type: info.type,
                format: info.format,
                internalFormat: info.internalFormat,
                clientSupport: info.clientSupport
            }
        };
    },

    UploadTexture(res, gl, arrayBuffer, info)
    {
        res.texture = gl.createTexture();
        gl.bindTexture(res._target, res.texture);

        const prevUnpack = gl.getParameter(gl.UNPACK_ALIGNMENT);
        gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);

        let offset = info.dataOffset;

        for (let face = 0; face < info.faces; face++)
        {
            let width = info.width;
            let height = info.height;
            const target = info.isCube ? gl.TEXTURE_CUBE_MAP_POSITIVE_X + face : res._target;

            for (let mip = 0; mip < info.mipmaps; mip++)
            {
                if (info.isCompressed)
                {
                    const size = this.GetCompressedMipSize(width, height, info.blockBytes);
                    this.EnsureRange(arrayBuffer, offset, size, info);

                    gl.compressedTexImage2D(
                        target,
                        mip,
                        info.internalFormat,
                        width,
                        height,
                        0,
                        new Uint8Array(arrayBuffer, offset, size)
                    );

                    offset += size;
                }
                else
                {
                    const level = this.ReadUncompressedLevel(arrayBuffer, offset, width, height, info);

                    gl.texImage2D(
                        target,
                        mip,
                        info.internalFormat,
                        width,
                        height,
                        0,
                        info.format,
                        info.type ?? gl.UNSIGNED_BYTE,
                        level.bytes
                    );

                    offset += level.size;
                }

                width = Math.max(width >> 1, 1);
                height = Math.max(height >> 1, 1);
            }
        }

        gl.pixelStorei(gl.UNPACK_ALIGNMENT, prevUnpack);
        gl.bindTexture(res._target, null);
    },

    ParseDDS(arrayBuffer, gl)
    {
        this.ValidateHeaderSize(arrayBuffer);

        const view = new DataView(arrayBuffer);
        if (view.getUint32(0, true) !== DDS.MAGIC)
        {
            throw new ErrResourceFormatInvalid({ format: "DDS", reason: "missing magic number" });
        }

        if (this.ReadU32(view, DDS.OFFSET_SIZE) !== DDS.HEADER_SIZE)
        {
            throw new ErrResourceFormatInvalid({
                format: "DDS",
                reason: `invalid header size ${this.ReadU32(view, DDS.OFFSET_SIZE)}`
            });
        }

        const caps2 = this.ReadU32(view, DDS.OFFSET_CAPS2);
        const flags = this.ReadU32(view, DDS.OFFSET_FLAGS);
        const pfFlags = this.ReadU32(view, DDS.OFFSET_PF_FLAGS);
        const width = this.ReadU32(view, DDS.OFFSET_WIDTH);
        const height = this.ReadU32(view, DDS.OFFSET_HEIGHT);
        const depth = Math.max(1, this.ReadU32(view, DDS.OFFSET_DEPTH) || 1);
        const mipmaps = (flags & DDSD_MIPMAPCOUNT)
            ? Math.max(1, this.ReadU32(view, DDS.OFFSET_MIPMAP_COUNT) || 1)
            : 1;

        this.ValidateDimensions(width, height);

        const info =
        {
            name: "DDS",
            width,
            height,
            depth,
            mipmaps,
            faces: (caps2 & DDSCAPS2_CUBEMAP) ? 6 : 1,
            isCube: !!(caps2 & DDSCAPS2_CUBEMAP),
            isVolume: !!(caps2 & DDSCAPS2_VOLUME),
            isPowerOfTwo: this.IsPowerOfTwo(width, height),
            target: (caps2 & DDSCAPS2_CUBEMAP) ? gl.TEXTURE_CUBE_MAP : gl.TEXTURE_2D,

            isFourCC: !!(pfFlags & DDPF_FOURCC),
            isCompressed: false,
            isLuminance: !!(pfFlags & DDPF_LUMINANCE),
            isRGB: !!(pfFlags & DDPF_RGB),
            hasAlpha: !!(pfFlags & DDPF_ALPHAPIXELS),
            isSRGB: false,

            type: gl.UNSIGNED_BYTE,
            format: null,
            internalFormat: null,
            blockBytes: 0,
            bpp: 0,

            clientSupport: false,
            dataOffset: DDS.MAGIC_SIZE + DDS.HEADER_SIZE
        };

        if (!info.isFourCC)
        {
            this.ResolveLegacyUncompressed(info, view, gl);
            return info;
        }

        const fourCC = this.ReadU32(view, DDS.OFFSET_PF_FOURCC);
        if (fourCC === FOURCC.DX10)
        {
            this.EnsureRange(arrayBuffer, DDS.OFFSET_DX10_FORMAT, DDS.HEADER_DX10_SIZE, info);
            this.ResolveDX10(info, view, gl);
            return info;
        }

        this.ResolveFourCC(info, fourCC, gl);
        return info;
    },

    ResolveLegacyUncompressed(info, view, gl)
    {
        const bpp = this.ReadU32(view, DDS.OFFSET_RGB_BPP);

        info.bpp = bpp;
        info.clientSupport = true;

        if (info.isRGB)
        {
            info.name = bpp === 24 ? "RGB" : "RGBA";
            info.format = bpp === 24 ? gl.RGB : gl.RGBA;
            info.internalFormat = info.format;
            this.AssignMaskOffsets(info, view, bpp);
            return;
        }

        if (info.isLuminance)
        {
            info.name = info.hasAlpha ? "Luminance Alpha" : "Luminance";
            info.format = info.hasAlpha ? gl.LUMINANCE_ALPHA : gl.LUMINANCE;
            info.internalFormat = info.format;
            return;
        }

        throw new ErrResourceFormatUnsupported({
            format: "DDS",
            reason: "Uncompressed DDS is not RGB or luminance",
            data: info
        });
    },

    ResolveFourCC(info, fourCC, gl)
    {
        const extensions = this.GetExtensions(gl);

        switch (fourCC)
        {
            case FOURCC.DXT1:
                this.SetCompressed(info, "DXT1/BC1", 8, this.GetExtConstant(extensions.s3tc, "COMPRESSED_RGBA_S3TC_DXT1_EXT"));
                return;

            case FOURCC.DXT3:
                this.SetCompressed(info, "DXT3/BC2", 16, this.GetExtConstant(extensions.s3tc, "COMPRESSED_RGBA_S3TC_DXT3_EXT"));
                return;

            case FOURCC.DXT5:
                this.SetCompressed(info, "DXT5/BC3", 16, this.GetExtConstant(extensions.s3tc, "COMPRESSED_RGBA_S3TC_DXT5_EXT"));
                return;

            case FOURCC.ATI1:
                this.SetCompressed(info, "ATI1/BC4_UNORM", 8, this.GetExtConstant(extensions.rgtc, "COMPRESSED_RED_RGTC1_EXT"));
                return;

            case FOURCC.ATI2:
                this.SetCompressed(info, "ATI2/BC5_UNORM", 16, this.GetExtConstant(extensions.rgtc, "COMPRESSED_RG_RGTC2_EXT"));
                return;
        }

        throw new ErrResourceFormatUnsupported({
            format: "DDS",
            reason: `FOURCC ${this.FourCCToString(fourCC)}`,
            data: info
        });
    },

    ResolveDX10(info, view, gl)
    {
        const extensions = this.GetExtensions(gl);
        const dxgiFormat = this.ReadU32(view, DDS.OFFSET_DX10_FORMAT);

        info.dxgiFormat = dxgiFormat;
        info.dxgiFormatName = DXGI_NAME[dxgiFormat] ?? `DXGI_${dxgiFormat}`;
        info.name = `DX10/${info.dxgiFormatName}`;
        info.dataOffset += DDS.HEADER_DX10_SIZE;

        switch (dxgiFormat)
        {
            case DXGI.R8_UNORM:
                this.SetUncompressed(info, "DX10/R8_UNORM", gl.LUMINANCE, gl.LUMINANCE, 8);
                info.isLuminance = true;
                return;

            case DXGI.R8G8_UNORM:
                this.SetUncompressed(info, "DX10/R8G8_UNORM", gl.LUMINANCE_ALPHA, gl.LUMINANCE_ALPHA, 16);
                info.isLuminance = true;
                info.hasAlpha = true;
                return;

            case DXGI.R8G8B8A8_UNORM:
            case DXGI.R8G8B8A8_UNORM_SRGB:
                this.SetDX10RGBA(info, gl, dxgiFormat === DXGI.R8G8B8A8_UNORM_SRGB, 0, 1, 2, 3);
                return;

            case DXGI.B8G8R8A8_UNORM:
            case DXGI.B8G8R8A8_UNORM_SRGB:
                this.SetDX10RGBA(info, gl, dxgiFormat === DXGI.B8G8R8A8_UNORM_SRGB, 2, 1, 0, 3);
                return;

            case DXGI.B8G8R8X8_UNORM:
            case DXGI.B8G8R8X8_UNORM_SRGB:
                this.SetDX10RGBA(info, gl, dxgiFormat === DXGI.B8G8R8X8_UNORM_SRGB, 2, 1, 0, null);
                return;

            case DXGI.BC1_UNORM:
            case DXGI.BC1_UNORM_SRGB:
                info.isSRGB = dxgiFormat === DXGI.BC1_UNORM_SRGB;
                this.SetCompressed(info, info.name, 8, info.isSRGB
                    ? this.GetExtConstant(extensions.s3tcSRGB, "COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT", "COMPRESSED_RGBA_S3TC_DXT1_EXT", extensions.s3tc)
                    : this.GetExtConstant(extensions.s3tc, "COMPRESSED_RGBA_S3TC_DXT1_EXT"));
                return;

            case DXGI.BC2_UNORM:
            case DXGI.BC2_UNORM_SRGB:
                info.isSRGB = dxgiFormat === DXGI.BC2_UNORM_SRGB;
                this.SetCompressed(info, info.name, 16, info.isSRGB
                    ? this.GetExtConstant(extensions.s3tcSRGB, "COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT", "COMPRESSED_RGBA_S3TC_DXT3_EXT", extensions.s3tc)
                    : this.GetExtConstant(extensions.s3tc, "COMPRESSED_RGBA_S3TC_DXT3_EXT"));
                return;

            case DXGI.BC3_UNORM:
            case DXGI.BC3_UNORM_SRGB:
                info.isSRGB = dxgiFormat === DXGI.BC3_UNORM_SRGB;
                this.SetCompressed(info, info.name, 16, info.isSRGB
                    ? this.GetExtConstant(extensions.s3tcSRGB, "COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT", "COMPRESSED_RGBA_S3TC_DXT5_EXT", extensions.s3tc)
                    : this.GetExtConstant(extensions.s3tc, "COMPRESSED_RGBA_S3TC_DXT5_EXT"));
                return;

            case DXGI.BC4_UNORM:
            case DXGI.BC4_SNORM:
                this.SetCompressed(info, info.name, 8, dxgiFormat === DXGI.BC4_SNORM
                    ? this.GetExtConstant(extensions.rgtc, "COMPRESSED_SIGNED_RED_RGTC1_EXT")
                    : this.GetExtConstant(extensions.rgtc, "COMPRESSED_RED_RGTC1_EXT"));
                return;

            case DXGI.BC5_UNORM:
            case DXGI.BC5_SNORM:
                this.SetCompressed(info, info.name, 16, dxgiFormat === DXGI.BC5_SNORM
                    ? this.GetExtConstant(extensions.rgtc, "COMPRESSED_SIGNED_RG_RGTC2_EXT")
                    : this.GetExtConstant(extensions.rgtc, "COMPRESSED_RG_RGTC2_EXT"));
                return;

            case DXGI.BC7_UNORM:
            case DXGI.BC7_UNORM_SRGB:
                info.isSRGB = dxgiFormat === DXGI.BC7_UNORM_SRGB;
                this.SetCompressed(info, info.name, 16, info.isSRGB
                    ? this.GetExtConstant(extensions.bptc, "COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT")
                    : this.GetExtConstant(extensions.bptc, "COMPRESSED_RGBA_BPTC_UNORM_EXT"));
                return;
        }

        throw new ErrResourceFormatUnsupported({
            format: "DDS",
            reason: `DX10 ${info.dxgiFormatName}`,
            data: info
        });
    },

    SetUncompressed(info, name, format, internalFormat, bpp)
    {
        info.name = name;
        info.isCompressed = false;
        info.format = format;
        info.internalFormat = internalFormat;
        info.bpp = bpp;
        info.clientSupport = true;
    },

    SetDX10RGBA(info, gl, isSRGB, rOffset, gOffset, bOffset, aOffset)
    {
        const internalFormat = isSRGB && device.glVersion > 1 ? gl.SRGB8_ALPHA8 : gl.RGBA;

        this.SetUncompressed(info, info.name, gl.RGBA, internalFormat, 32);
        info.isRGB = true;
        info.hasAlpha = aOffset !== null;
        info.isSRGB = isSRGB;
        info.rOffset = rOffset;
        info.gOffset = gOffset;
        info.bOffset = bOffset;
        info.aOffset = aOffset ?? 3;
    },

    SetCompressed(info, name, blockBytes, internalFormat)
    {
        info.name = name;
        info.isCompressed = true;
        info.blockBytes = blockBytes;
        info.internalFormat = internalFormat;
        info.clientSupport = !!internalFormat;
    },

    AssignMaskOffsets(info, view, bpp)
    {
        info.rOffset = num.getLongWordOrder(this.ReadI32(view, DDS.OFFSET_R_MASK));
        info.gOffset = num.getLongWordOrder(this.ReadI32(view, DDS.OFFSET_G_MASK));
        info.bOffset = num.getLongWordOrder(this.ReadI32(view, DDS.OFFSET_B_MASK));
        info.aOffset = bpp !== 24 ? num.getLongWordOrder(this.ReadI32(view, DDS.OFFSET_A_MASK)) : 3;
    },

    ReadUncompressedLevel(arrayBuffer, offset, width, height, info)
    {
        const bpp = info.bpp || 32;
        const srcBytesPerPixel = bpp >> 3;
        const srcSize = width * height * srcBytesPerPixel;

        this.EnsureRange(arrayBuffer, offset, srcSize, info);

        if (info.isLuminance)
        {
            return {
                bytes: new Uint8Array(arrayBuffer, offset, srcSize),
                size: srcSize
            };
        }

        const src = new Uint8Array(arrayBuffer, offset, srcSize);

        if (bpp === 24)
        {
            const out = new Uint8Array(width * height * 3);
            const rOffset = info.rOffset ?? 0;
            const gOffset = info.gOffset ?? 1;
            const bOffset = info.bOffset ?? 2;

            for (let i = 0; i < width * height; i++)
            {
                const s = i * 3;
                out[s + 0] = src[s + rOffset];
                out[s + 1] = src[s + gOffset];
                out[s + 2] = src[s + bOffset];
            }

            return { bytes: out, size: srcSize };
        }

        const out = new Uint8Array(width * height * 4);
        const rOffset = info.rOffset ?? 0;
        const gOffset = info.gOffset ?? 1;
        const bOffset = info.bOffset ?? 2;
        const aOffset = info.aOffset ?? 3;

        for (let i = 0; i < width * height; i++)
        {
            const s = i * srcBytesPerPixel;
            const d = i * 4;

            out[d + 0] = src[s + rOffset];
            out[d + 1] = src[s + gOffset];
            out[d + 2] = src[s + bOffset];
            out[d + 3] = info.hasAlpha && srcBytesPerPixel > aOffset ? src[s + aOffset] : 255;
        }

        return { bytes: out, size: srcSize };
    },

    GetExtensions(gl)
    {
        return {
            s3tc: this.GetExtension(gl, "WEBGL_compressed_texture_s3tc", [
                "MOZ_WEBGL_compressed_texture_s3tc",
                "WEBKIT_WEBGL_compressed_texture_s3tc"
            ]),
            s3tcSRGB: this.GetExtension(gl, "WEBGL_compressed_texture_s3tc_srgb", [
                "MOZ_WEBGL_compressed_texture_s3tc_srgb",
                "WEBKIT_WEBGL_compressed_texture_s3tc_srgb"
            ]),
            rgtc: this.GetExtension(gl, "EXT_texture_compression_rgtc"),
            bptc: this.GetExtension(gl, "EXT_texture_compression_bptc")
        };
    },

    GetExtension(gl, name, fallbacks = [])
    {
        if (device && typeof device.GetExtension === "function")
        {
            const ext = device.GetExtension(name);
            if (ext) return ext;
        }

        const names = [ name, ...fallbacks ];
        for (let i = 0; i < names.length; i++)
        {
            const ext = gl.getExtension(names[i]);
            if (ext) return ext;
        }

        return null;
    },

    GetExtConstant(ext, name, fallbackName, fallbackExt)
    {
        if (ext && ext[name] !== undefined) return ext[name];
        if (ext && GL_COMPRESSED[name] !== undefined) return GL_COMPRESSED[name];

        if (fallbackName)
        {
            return this.GetExtConstant(fallbackExt, fallbackName);
        }

        return null;
    },

    GetCompressedMipSize(width, height, blockBytes)
    {
        return Math.max(1, (width + 3) >> 2) * Math.max(1, (height + 3) >> 2) * blockBytes;
    },

    IsPowerOfTwo(width, height)
    {
        return ((width & (width - 1)) === 0) && ((height & (height - 1)) === 0);
    },

    ValidateHeaderSize(arrayBuffer)
    {
        if (!arrayBuffer?.byteLength)
        {
            throw new ErrResourceFormatInvalid({ format: "DDS", reason: "file is empty" });
        }

        if (arrayBuffer.byteLength < DDS.MAGIC_SIZE + DDS.HEADER_SIZE)
        {
            throw new ErrResourceFormatInvalid({
                format: "DDS",
                reason: "file is smaller than the DDS header",
                byteLength: arrayBuffer.byteLength
            });
        }
    },

    ValidateDimensions(width, height)
    {
        if (width < 1 || height < 1)
        {
            throw new ErrResourceFormatInvalid({
                format: "DDS",
                reason: `invalid dimensions ${width}x${height}`
            });
        }
    },

    EnsureRange(arrayBuffer, offset, size, info)
    {
        if (offset < 0 || size < 0 || offset + size > arrayBuffer.byteLength)
        {
            throw new ErrResourceFormatInvalid({
                format: "DDS",
                reason: "Unexpected end of texture data",
                data: {
                    name: info?.name,
                    width: info?.width,
                    height: info?.height,
                    mipmaps: info?.mipmaps,
                    dataOffset: info?.dataOffset,
                    offset,
                    size,
                    byteLength: arrayBuffer.byteLength
                }
            });
        }
    },

    ReadU32(view, offset)
    {
        return view.getUint32(offset, true);
    },

    ReadI32(view, offset)
    {
        return view.getInt32(offset, true);
    },

    FourCCToString(value)
    {
        return String.fromCharCode(
            value & 0xff,
            (value >> 8) & 0xff,
            (value >> 16) & 0xff,
            (value >> 24) & 0xff
        );
    }
};
