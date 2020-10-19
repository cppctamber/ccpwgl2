import { meta } from "utils";
import { Tw2Error } from "core";


@meta.ctor("EveSOFDataArea")
export class EveSOFDataArea
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


    /**
     * Checks if a data area exists by type
     * @param {Number} type
     * @returns {boolean}
     */
    Has(type)
    {
        const name = EveSOFDataArea.Type[type];

        if (name === undefined)
        {
            throw new ErrSOFAreaTypeUnknown({ type });
        }

        return !!this[name];
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

        return this[EveSOFDataArea.Type[type]];
    }

    /**
     * Usage index
     * TODO: Figure out how to automate the creation of this list
     * @type {string[]}
     */
    static Type = [
        "Primary",
        "Glass",
        "Sails",
        "Reactor",
        "Darkhull",
        "Wreck",
        "Rock",
        "Monument",
        // Below are incorrect, figure out what they are
        "Primary",
        "Primary"
    ];
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
