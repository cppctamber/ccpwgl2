import { meta } from "utils";
import { Tw2SamplerState } from "./Tw2SamplerState";


@meta.type("Tw2SamplerOverride")
export class Tw2SamplerOverride extends meta.Model
{

    @meta.string
    name = "";

    @meta.boolean
    enable = true;

    @meta.uint
    addressUMode = -1;

    @meta.uint
    addressVMode = -1;

    @meta.uint
    addressWMode = -1;

    @meta.uint
    filterMode = -1;

    @meta.uint
    mipFilterMode = -1;

    @meta.uint
    magFilterMode = -1;

    @meta.notImplemented
    @meta.uint
    lodBias = -1;

    @meta.notImplemented
    @meta.uint
    maxMipLevel = -1;

    @meta.uint
    maxAnisotropy = -1;

    _sampler = null;
    _isDirty = true;

    /**
     * Fires on value changes
     */
    UpdateValues()
    {
        this._isDirty = true;
    }

    /**
     * Gets the sampler
     * @param {Tw2SamplerState} o
     * @returns {Tw2SamplerState}
     */
    GetSampler(o)
    {
        if (!this.enable)
        {
            return o;
        }

        if (this._sampler && !this._isDirty)
        {
            return this._sampler;
        }

        const s = this._sampler = this._sampler || new Tw2SamplerState();

        s.name = o.name;
        s.samplerType = o.samplerType;
        s.isVolume = o.isVolume;
        s.registerIndex  = o.registerIndex;

        const overrides = {
            filterMode: this.filterMode !== -1 ? this.filterMode : o.filterMode,
            mipFilterMode: this.mipFilterMode !== -1 ? this.mipFilterMode : o.mipFilterMode,
            magFilterMode: this.magFilterMode !== -1 ? this.magFilterMode : o.magFilterMode,
            addressUMode: this.addressUMode  !== -1 ? this.addressUMode : o.addressUMode,
            addressVMode: this.addressVMode !== -1 ? this.addressVMode : o.addressVMode,
            addressWMode: this.addressWMode !== -1 ? this.addressWMode : o.addressWMode,
            maxAnisotropy: this.maxAnisotropy !== -1 ? this.maxAnisotropy : o.maxAnisotropy
        };

        s.ResolveModes(overrides);

        this._isDirty =  false;
        return s;
    }
}
