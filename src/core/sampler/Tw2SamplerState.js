import { FilterMode, MipFilterMode, GL_LINEAR, GL_REPEAT, GL_TEXTURE_2D } from "../../global";

/**
 * Tw2SamplerState
 *
 * @property {String} name
 * @property {Number} registerIndex
 * @property {Number} minFilter
 * @property {Number} maxFilter
 * @property {Number} magFilter
 * @property {Number} minFilterNoMips
 * @property {Number} addressU
 * @property {Number} addressV
 * @property {Number} addressW
 * @property {Number} anisotropy
 * @property {Number} samplerType
 * @property {Boolean} isVolume
 * @property {Number} hash
 */
export class Tw2SamplerState
{

    name = "";
    registerIndex = 0;
    minFilter = GL_LINEAR;
    maxFilter = GL_LINEAR;
    magFilter = GL_LINEAR;
    minFilterNoMips = GL_LINEAR;
    addressU = GL_REPEAT;
    addressV = GL_REPEAT;
    addressW = GL_REPEAT;
    anisotropy = 1;
    samplerType = GL_TEXTURE_2D;
    isVolume = false;
    hash = 0;

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
    }

    /**
     * Apply
     * @param {Tw2Device} device
     * @param {Boolean} hasMipMaps
     * @param {Boolean} [forceAddressMode]
     */
    Apply(device, hasMipMaps, forceAddressMode)
    {
        const
            targetType = this.samplerType,
            gl = device.gl,
            ext = device.GetExtension("EXT_texture_filter_anisotropic"),
            useAddress = hasMipMaps || forceAddressMode;

        gl.texParameteri(targetType, gl.TEXTURE_WRAP_S, useAddress ? this.addressU : gl.CLAMP_TO_EDGE);
        gl.texParameteri(targetType, gl.TEXTURE_WRAP_T, useAddress ? this.addressV : gl.CLAMP_TO_EDGE);
        gl.texParameteri(targetType, gl.TEXTURE_MIN_FILTER, hasMipMaps ? this.minFilter : this.minFilterNoMips);
        gl.texParameteri(targetType, gl.TEXTURE_MAG_FILTER, this.magFilter);

        if (ext && device.enableAnisotropicFiltering)
        {
            gl.texParameterf(targetType, ext.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(this.anisotropy, ext.maxAnisotropy));
        }
    }

}
