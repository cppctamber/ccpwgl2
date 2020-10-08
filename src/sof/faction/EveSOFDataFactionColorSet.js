import { meta, vec4 } from "global";
import { Tw2Error } from "core/class";


@meta.ctor("EveSOFDataFactionColorSet")
export class EveSOFDataFactionColorSet
{

    @meta.color
    Black = vec4.create();

    @meta.color
    Blue = vec4.create();

    @meta.color
    Booster = vec4.create();

    @meta.color
    Cyan = vec4.create();

    @meta.color
    Darkhull = vec4.create();

    @meta.color
    Fire = vec4.create();

    @meta.color
    Glass = vec4.create();

    @meta.color
    Green = vec4.create();

    @meta.color
    Hull = vec4.create();

    @meta.color
    Killmark = vec4.create();

    @meta.color
    Orange = vec4.create();

    @meta.color
    Primary = vec4.create();

    @meta.color
    PrimaryLight = vec4.create();

    @meta.color
    Reactor = vec4.create();

    @meta.color
    Red = vec4.create();

    @meta.color
    Secondary = vec4.create();

    @meta.color
    SecondaryLight = vec4.create();

    @meta.color
    Tertiary = vec4.create();

    @meta.color
    TertiaryLight = vec4.create();

    @meta.color
    White = vec4.create();

    @meta.color
    WhiteLight = vec4.create();

    @meta.color
    Yellow = vec4.create();


    /**
     * Checks if a color type exists
     * @param {Number} usageType
     * @returns {boolean}
     */
    Has(usageType)
    {
        const name = EveSOFDataFactionColorSet.UsageIndex[usageType];
        
        if (name === undefined)
        {
            throw new ErrSOFFactionColorSetUsageTypeUnknown({ usageType });
        }
        
        return !!this[name];
    }
    
    /**
     * Gets a color type
     * @param {Number} usageType
     * @param {vec4} [out=vec4.create()]
     * @return {vec4} out
     */
    Get(usageType, out = vec4.create())
    {
        if (!this.Has(usageType))
        {
            throw new ErrSOFFactionColorSetUsageTypeNotFound({ usageType });
        }
        
        return vec4.copy(out, this[EveSOFDataFactionColorSet.UsageIndex[usageType]]);
    }

    /**
     * Usage index
     * TODO: Figure out how to automate this array
     * @type {string[]}
     */
    static UsageIndex = [
        "Primary",
        "Secondary",
        "Tertiary",
        "Black",
        "White",
        "Yellow",
        "Orange",
        "Red",
        "Blue",
        "Green",
        "Cyan",
        "Fire",
        "Hull",
        "Glass",
        "Reactor",
        "Darkhull",
        "Booster",
        "Killmark",
        "PrimaryLight",
        "SecondaryLight",
        "TertiaryLight",
        "WhiteLight"
    ]
    
}


/**
 * Throws when a feature is not implemented
 */
export class ErrSOFFactionColorSetUsageTypeUnknown extends Tw2Error
{
    constructor(data)
    {
        super(data, "SOF faction color set usage type unknown (%usageType%)");
        this.unknownUsageType = true;
    }
}

/**
 * Throws when a feature is not implemented
 */
export class ErrSOFFactionColorSetUsageTypeNotFound extends Tw2Error
{
    constructor(data)
    {
        super(data, "SOF faction color set usage type not found (%usageType%)");
    }
}
