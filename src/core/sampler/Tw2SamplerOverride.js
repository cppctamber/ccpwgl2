import { meta } from "utils";
import { Tw2SamplerState } from "./Tw2SamplerState";


/**
 * NAMING DRIFT vs carbonengine/trinity (align later; Carbon names win):
 * filterMode=minFilter, magFilterMode=magFilter, mipFilterMode=mipFilter,
 * addressU/V/WMode=addressU/V/W, lodBias=mipLODBias. maxMipLevel is legacy
 * D3D9 with no Carbon equivalent (Carbon uses minLOD/maxLOD). Serialized
 * values use Trinity enum conventions (address 0=wrap/2=clamp 0-based,
 * filter 3=anisotropic) — NOT D3D9's 1-based enums; check ResolveModes
 * interprets them correctly before relying on overrides at draw time.
 */
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
     *
     * Production struct is 56 bytes and follows Carbon's Sampler::Save field
     * order exactly (carbonengine trinity/shadercompiler/EffectData.h:366):
     * name, comparison, minFilter, magFilter, mipFilter, addressU, addressV,
     * addressW, mipLODBias, maxAnisotropy, comparisonFunc, then a 3-dword
     * tail (borderColor/minLOD/maxLOD — all zero in every specimen observed;
     * split is provisional). Values use Trinity enum conventions as stored.
     * Verified against res:/dx9/model/celestial/environment/rock/
     * asteroidset_06/[size]/single/[lod]/fx/as6_breacheroidfx_01a.black
     * (TQ build 3421648):
     * DiffuseMapSampler = [comparison 0, min 3, mag 3, mip 1, aU 2, aV 2,
     * aW 0, lodBias 0.0, maxAniso 4, compFunc 0, 0, 0, 0].
     *
     * @param {Tw2BlackBinaryReader} r
     * @returns {Tw2SamplerOverride}
     */
    static blackStruct(r)
    {
        const item = new this();
        item.name = r.ReadStringU16();
        r.ExpectU16(0, "unknown content");
        item.comparison = r.ReadU32();
        item.filterMode = r.ReadU32();      // minFilter in Carbon terms
        item.magFilterMode = r.ReadU32();
        item.mipFilterMode = r.ReadU32();
        item.addressUMode = r.ReadU32();
        item.addressVMode = r.ReadU32();
        item.addressWMode = r.ReadU32();
        item.lodBias = r.ReadF32();         // mipLODBias
        item.maxAnisotropy = r.ReadU32();
        item.comparisonFunc = r.ReadU32();
        item.borderColor = r.ReadU32();
        item.minLOD = r.ReadF32();
        item.maxLOD = r.ReadF32();
        return item;
    }
}
