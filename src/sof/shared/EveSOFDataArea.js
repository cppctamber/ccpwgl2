import { meta } from "utils";
import { Tw2Error } from "core";
import { EveSOFDataAreaMaterial } from "../shared/EveSOFDataAreaMaterial";

@meta.type("EveSOFDataArea")
export class EveSOFDataArea extends meta.Model
{

    @meta.struct("EveSOFDataAreaMaterial")
    Black = null;

    @meta.struct("EveSOFDataAreaMaterial")
    Blue = null;

    @meta.struct("EveSOFDataAreaMaterial")
    Booster = null;

    @meta.struct("EveSOFDataAreaMaterial")
    Cyan = null;

    @meta.struct("EveSOFDataAreaMaterial")
    Darkhull = null;

    @meta.struct("EveSOFDataAreaMaterial")
    Fire = null;

    @meta.struct("EveSOFDataAreaMaterial")
    Glass = null;

    @meta.struct("EveSOFDataAreaMaterial")
    Green = null;

    @meta.struct("EveSOFDataAreaMaterial")
    Hull = null;

    @meta.struct("EveSOFDataAreaMaterial")
    Killmark = null;

    @meta.struct("EveSOFDataAreaMaterial")
    Monument = null;

    @meta.struct("EveSOFDataAreaMaterial")
    Orange = null;

    @meta.struct("EveSOFDataAreaMaterial")
    Ornament = null;

    @meta.struct("EveSOFDataAreaMaterial")
    Primary = null;

    @meta.struct("EveSOFDataAreaMaterial")
    Reactor = null;

    @meta.struct("EveSOFDataAreaMaterial")
    Red = null;

    @meta.struct("EveSOFDataAreaMaterial")
    Rock = null;

    @meta.struct("EveSOFDataAreaMaterial")
    Sails = null;

    @meta.struct("EveSOFDataAreaMaterial")
    SimplePrimary = null;

    @meta.struct("EveSOFDataAreaMaterial")
    Secondary = null;

    @meta.struct("EveSOFDataAreaMaterial")
    Tertiary = null;

    @meta.struct("EveSOFDataAreaMaterial")
    White = null;

    @meta.struct("EveSOFDataAreaMaterial")
    Yellow = null;

    @meta.isPrivate
    _typesByIndex = [];

    /**
     * Gets a type by it's index
     * @param {Number} type
     * @return {*}
     * @constructor
     */
    GetTypeByIndex(type)
    {
        const name = this._typesByIndex[type];
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
     * Optional method which receives the property and value written to the parent object
     * @param {String} property
     * @param {Object} value
     * @param {Object} parent
     */
    static onAfterBlackPropertyReader(property, value, parent)
    {
        if (value instanceof EveSOFDataAreaMaterial)
        {
            value.name = property;
            parent._typesByIndex.push(property);
        }
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
