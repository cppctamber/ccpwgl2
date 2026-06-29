import { meta } from "utils";
import { Tw2SamplerState } from "./Tw2SamplerState";


@meta.type("Tw2SamplerOverride")
@meta.wgl.define("Tw2SamplerOverride")
export class Tw2SamplerOverride extends meta.Model
{

    @meta.string
    name = "";

    @meta.boolean
    enable = true;

    @meta.int32
    addressUMode = -1;

    @meta.int32
    addressVMode = -1;

    @meta.int32
    addressWMode = -1;

    @meta.int32
    filterMode = -1;

    @meta.int32
    mipFilterMode = -1;

    @meta.int32
    magFilterMode = -1;

    @meta.notImplemented
    @meta.int32
    lodBias = -1;

    @meta.notImplemented
    @meta.int32
    maxMipLevel = -1;

    @meta.int32
    maxAnisotropy = -1;

    _sampler = null;
    _isDirty = true;

    /**
     * Fires on value changes
     */
    OnValueChanged()
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

    /**
     * Black reader
     * @param {Tw2BlackBinaryReader} r
     * @returns {Tw2SamplerOverride}
     */
    static blackStruct(r)
    {
        const item = new this();
        item.mipFilterMode = r.ReadU16();
        item.maxAnisotropy = r.ReadU16();
        item.name = r.ReadStringU16();
        item.maxMipLevel = r.ReadU16();
        item.addressUMode = r.ReadU16();
        item.addressVMode = r.ReadU16();
        item.addressWMode = r.ReadU16();
        item.filterMode = r.ReadU16();
        item.lodBias = r.ReadF32();
        return item;
    }
}
