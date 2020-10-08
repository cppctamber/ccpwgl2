import { meta } from "global";
import { Tw2Error } from "core/class";


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
     * Checks if a data area exists by usage usageType
     * @param {Number} usageType
     * @returns {boolean}
     */
    Has(usageType)
    {
        const name = EveSOFDataArea.UsageIndex[usageType];
        
        if (name === undefined)
        {
            throw new ErrSOFDataAreaUsageTypeUnknown({ usageType });
        }
        
        return !!this[name];
    }

    /**
     * Gets a data area by usage usageType
     * @param {Number} usageType
     * @returns {EveSOFDataAreaMaterial}
     */
    Get(usageType)
    {
        if (!this.Has(usageType))
        {
            throw new ErrSOFDataAreaUsageTypeNotFound({ usageType });
        }
        
        return this[EveSOFDataArea.UsageIndex[usageType]];
    }

    /**
     * Usage index
     * TODO: Figure out how to automate the creation of this list
     * @usageType {string[]}
     */
    static UsageIndex = [
        "Primary",
        "Glass",
        "Sail",
        "Reactor",
        "Darkhull",
        "Wreck",
        "Rock",
        "Monument",
        undefined, // ????
        undefined  // ????
    ]
}

/**
 * Throws when a feature is not implemented
 */
export class ErrSOFDataAreaUsageTypeUnknown extends Tw2Error
{
    constructor(data)
    {
        super(data, "SOF area usage type unknown (%usageType%)");
        this.unknownUsageType = true;
    }
}

/**
 * Throws when a feature is not implemented
 */
export class ErrSOFDataAreaUsageTypeNotFound extends Tw2Error
{
    constructor(data)
    {
        super(data, "SOF area usage type not found (%usageType%)");
    }
}
