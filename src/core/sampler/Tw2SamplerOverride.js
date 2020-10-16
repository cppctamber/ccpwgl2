import { meta } from "global";
import { Tw2SamplerState } from "./Tw2SamplerState";


const WrapModesByName = {
    NONE: 0,
    REPEAT: 1,
    MIRRORED_REPEAT: 2,
    CLAMP_TO_EDGE: 3
};


const FilterModesByName = {
    NEAREST: 0,
    LINEAR: 1
};


const MipFilterModesByName = {
    NONE: 0,
    MIPMAP_NEAREST: 1,
    MIPMAP_LINEAR: 2
};


@meta.ctor("Tw2SamplerOverride")
export class Tw2SamplerOverride
{

    @meta.string
    name = "";

    @meta.enums(WrapModesByName, 3)
    addressU = 0;

    @meta.enums(WrapModesByName, 3)
    addressV = 0;

    @meta.enums(WrapModesByName, 3)
    addressW = 0;

    @meta.enums(FilterModesByName, 2)
    filter = 0;

    @meta.enums(MipFilterModesByName, 2)
    mipFilter = 0;

    @meta.notImplemented
    @meta.uint
    lodBias = 0;

    @meta.uint
    maxMipLevel = 0;

    @meta.uint
    maxAnisotropy = 0;

    @meta.boolean
    forceMipMaps = false;


    _sampler = null;
    _isDirty = true;

    /**
     * Fires on value changes
     * TODO: Development only
     */
    UpdateValues()
    {
        this._isDirty = true;
    }

    /**
     * Gets the sampler
     * @param {Tw2Device} device
     * @param {Tw2SamplerState} originalSampler
     * @returns {Tw2SamplerState}
     */
    GetSampler(device, originalSampler)
    {
        if (this._isDirty)
        {
            // Development only
            this._isDirty = false;
        }
        else if (this._sampler)
        {
            return this._sampler;
        }

        this._sampler = new Tw2SamplerState();
        const sampler = this._sampler;
        sampler.registerIndex = originalSampler.registerIndex;
        sampler.name = originalSampler.name;
        sampler.forceMipMaps = this.forceMipMaps;

        const { wrapModes, gl } = device;

        if (this.filter === 1)
        {
            switch (this.mipFilter)
            {
                case 0:
                    sampler.minFilter = gl.NEAREST;
                    break;

                case 1:
                    sampler.minFilter = gl.NEAREST_MIPMAP_NEAREST;
                    break;

                default:
                    sampler.minFilter = gl.NEAREST_MIPMAP_LINEAR;
            }

            sampler.minFilterNoMips = gl.NEAREST;
            sampler.magFilter = gl.NEAREST;
        }
        else
        {
            switch (this.mipFilter)
            {
                case 0:
                    sampler.minFilter = gl.LINEAR;
                    break;

                case 1:
                    sampler.minFilter = gl.LINEAR_MIPMAP_NEAREST;
                    break;

                default:
                    sampler.minFilter = gl.LINEAR_MIPMAP_LINEAR;
            }

            sampler.minFilterNoMips = gl.LINEAR;
            sampler.magFilter = gl.LINEAR;
        }

        if (this.filter === 3 || this.mipFilter === 3)
        {
            sampler.anisotropy = Math.max(this.maxAnisotropy, 1);
        }

        sampler.addressU = wrapModes[this.addressU];
        sampler.addressV = wrapModes[this.addressV];
        sampler.addressW = wrapModes[this.addressW];
        sampler.samplerType = originalSampler.samplerType;
        sampler.isVolume = originalSampler.isVolume;
        sampler.ComputeHash();
        return sampler;
    }
}
