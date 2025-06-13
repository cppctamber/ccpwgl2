import { meta } from "utils";
import { Tw2Error } from "core";
import { EveSOFDataAreaMaterial } from "../shared/EveSOFDataAreaMaterial";

@meta.type("EveSOFDataArea")
export class EveSOFDataArea extends meta.Model
{

    @meta.struct("EveSOFDataAreaMaterial")
    Primary = null;

    @meta.struct("EveSOFDataAreaMaterial")
    Glass = null;

    @meta.struct("EveSOFDataAreaMaterial")
    Sails = null;

    @meta.struct("EveSOFDataAreaMaterial")
    Reactor = null;

    @meta.struct("EveSOFDataAreaMaterial")
    Darkhull = null;

    @meta.struct("EveSOFDataAreaMaterial")
    Rock = null;

    @meta.struct("EveSOFDataAreaMaterial")
    Monument = null;

    @meta.struct("EveSOFDataAreaMaterial")
    Ornament = null;

    @meta.struct("EveSOFDataAreaMaterial")
    SimplePrimary = null;

    /**
     * SOF Area types
     */
    static Types = [
        "Primary",
        "Glass",
        "Sails",
        "Reactor",
        "Darkhull",
        "Rock",
        "Monument",
        "Ornament",
        "SimplePrimary"
    ];

    /**
     * Gets a type by it's index
     * @param {Number} type
     * @return {*}
     * @constructor
     */
    GetTypeByIndex(type)
    {
        const name = this.constructor.Types[type];
        return this.hasOwnProperty(name) ? this[name] : null;
    }

    /**
     * Checks if a data area exists by type
     * @param {Number} type
     * @returns {boolean}
     */
    Has(type)
    {
        const area = this.GetTypeByIndex(type);
        return !!area;
    }

    /**
     * Gets a data area by type
     * @param {Number} type
     * @returns {EveSOFDataAreaMaterial}
     */
    Get(type)
    {
        if (!this.Has(type))
        {
            throw new ErrSOFAreaTypeNotFound({ type });
        }

        return this.GetTypeByIndex(type);
    }

    /**
     * Merges two data areas
     * @param {EveSOFDataArea} a
     * @param {EveSOFDataArea} b
     * @param {EveSOFDataArea} [out=new EveSOFDataArea]
     * @returns {EveSOFDataArea}
     */
    static combine(a, b, out)
    {
        return a;

        /*

        // No need to combine anymore
        out = out || new this();
        if (!a) return out;
        out._typesByIndex.splice(0);
        a._typesByIndex.forEach(type => out._typesByIndex.push(type));
        this.Types.forEach(type => out[type] = EveSOFDataAreaMaterial.combine(a[type], b ? b[type] : null, out[type]));
        return out;

         */
    }

}

/**
 * Throws when a feature is not implemented
 */
export class ErrSOFAreaTypeUnknown extends Tw2Error
{
    constructor(data)
    {
        super(data, "SOF area type unknown (%type%)");
        this.unknownType = true;
    }
}

/**
 * Throws when a feature is not implemented
 */
export class ErrSOFAreaTypeNotFound extends Tw2Error
{
    constructor(data)
    {
        super(data, "SOF area type not found (%type%)");
    }
}
