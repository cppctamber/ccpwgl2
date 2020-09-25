import { meta, FilterMode, MipFilterMode, GL_LINEAR, GL_REPEAT, GL_TEXTURE_2D } from "global";


@meta.ctor("Tw2SamplerState")
export class Tw2SamplerState
{

    @meta.string
    name = "";

    @meta.uint
    registerIndex = 0;

    @meta.uint
    minFilter = GL_LINEAR;

    @meta.uint
    maxFilter = GL_LINEAR;

    @meta.uint
    magFilter = GL_LINEAR;

    @meta.uint
    minFilterNoMips = GL_LINEAR;

    @meta.uint
    addressU = GL_REPEAT;

    @meta.uint
    addressV = GL_REPEAT;

    @meta.uint
    addressW = GL_REPEAT;

    @meta.uint
    anisotropy = 1;

    @meta.uint
    samplerType = GL_TEXTURE_2D;

    @meta.boolean
    isVolume = false;

    @meta.uint
    @meta.isPrivate
    hash = 0;

    @meta.boolean
    forceAddressModes = false;

    // Not used
    _borderColor = null;
    _comparison = null;
    _comparisonFunc = null;
    _mipLODBias = null;
    _minLOD = null;
    _maxLOD = null;

    /**
     * Gets the current filter mode
     * @returns {Number}
     */
    get filterMode()
    {
        return this.minFilterNoMips in FilterMode ? FilterMode[this.minFilterNoMips] : 2;
    }

    /**
     * Gets the current mip filter mode
     * @returns {Number}
     */
    get mipFilterMode()
    {
        return this.minFilter in MipFilterMode ? MipFilterMode[this.minFilter] : 2;
    }

    /**
     * Computes the sampler hash
     */
    ComputeHash()
    {
        this.hash = 2166136261;
        this.hash *= 16777619;
        this.hash ^= this.minFilter;
        this.hash *= 16777619;
        this.hash ^= this.maxFilter;
        this.hash *= 16777619;
        this.hash ^= this.addressU;
        this.hash *= 16777619;
        this.hash ^= this.addressV;
        this.hash *= 16777619;
        this.hash ^= this.anisotropy;
        this.hash += this.forceAddressModes ? 1 : 0;
    }

    /**
     * Apply
     * @param {Tw2Device} device
     * @param {Boolean} hasMipMaps
     */
    Apply(device, hasMipMaps)
    {
        const
            targetType = this.samplerType,
            gl = device.gl,
            ext = device.GetExtension("EXT_texture_filter_anisotropic"),
            useAddress = hasMipMaps || this.forceAddressModes;

        gl.texParameteri(targetType, gl.TEXTURE_WRAP_S, useAddress ? this.addressU : gl.CLAMP_TO_EDGE);
        gl.texParameteri(targetType, gl.TEXTURE_WRAP_T, useAddress ? this.addressV : gl.CLAMP_TO_EDGE);

        if (targetType === gl.TEXTURE_3D || targetType === gl.TEXTURE_2D_ARRAY)
        {
            gl.texParameteri(targetType, gl.TEXTURE_WRAP_R, useAddress ? this.addressW : gl.CLAMP_TO_EDGE);
        }

        gl.texParameteri(targetType, gl.TEXTURE_MIN_FILTER, hasMipMaps ? this.minFilter : this.minFilterNoMips);
        gl.texParameteri(targetType, gl.TEXTURE_MAG_FILTER, this.magFilter);

        if (ext && device.enableAnisotropicFiltering)
        {
            gl.texParameterf(targetType, ext.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(this.anisotropy, ext.maxAnisotropy));
        }
    }

}
