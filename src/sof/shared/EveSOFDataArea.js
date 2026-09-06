import { meta } from "utils";
import { Tw2Error } from "core";
import { EveSOFDataAreaMaterial } from "../shared/EveSOFDataAreaMaterial";

@meta.define("EveSOFDataArea", true)
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

    @meta.struct("EveSOFDataAreaMaterial")
    Turret = null;

    /**
     * SOF area type indices, matching Carbon's `EveSOFDataArea::AreaType`.
     *
     * Hull areas declare their type as one of these NUMBERS, so the order here
     * is data, not presentation.
     * @type {Object<String, Number>}
     */
    static AreaType = {
        TYPE_PRIMARY: 0,
        TYPE_GLASS: 1,
        TYPE_SAILS: 2,
        TYPE_REACTOR: 3,
        TYPE_DARKHULL: 4,
        TYPE_WRECK: 5,
        TYPE_ROCK: 6,
        TYPE_MONUMENT: 7,
        TYPE_ORNAMENT: 8,
        TYPE_SIMPLEPRIMARY: 9,
        TYPE_TURRET: 10,
        TYPE_MAX: 11,
        TYPE_NO_OVERWRITE: 11
    };

    /**
     * The area material field each type index names, or null where the type has
     * no field on this object.
     *
     * Slot 5 is TYPE_WRECK, and it is deliberately EMPTY: Carbon's blue mapping
     * for EveSOFDataArea declares nine materials and no wreck among them, and no
     * shipped faction carries one - wreck materials come from the generic data
     * instead. This list previously omitted the gap and put "Wreck" at 9, which
     * shifted every type from 5 up by one, so an area declaring TYPE_WRECK read
     * Rock, TYPE_ROCK read Monument, and so on to TYPE_SIMPLEPRIMARY reading a
     * field the data can never fill.
     * @type {Array<String|null>}
     */
    static Types = [
        "Primary",
        "Glass",
        "Sails",
        "Reactor",
        "Darkhull",
        null,
        "Rock",
        "Monument",
        "Ornament",
        "SimplePrimary",
        "Turret"
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
