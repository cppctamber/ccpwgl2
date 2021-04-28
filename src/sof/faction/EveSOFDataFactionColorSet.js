import { meta } from "utils";
import { vec4 } from "math";
import { Tw2Error } from "core";


@meta.type("EveSOFDataFactionColorSet")
export class EveSOFDataFactionColorSet extends meta.Model
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
     * @param {Number} type
     * @returns {boolean}
     */
    Has(type)
    {
        const name = EveSOFDataFactionColorSet.Type[type];

        if (name === undefined)
        {
            throw new ErrSOFFactionColorSetTypeUnknown({ type });
        }

        return !!this[name];
    }

    /**
     * Gets a color type
     * @param {Number} type
     * @param {vec4} [out=vec4.create()]
     * @return {vec4} out
     */
    Get(type, out = vec4.create())
    {
        if (!this.Has(type))
        {
            throw new ErrSOFFactionColorSetTypeNotFound({ type });
        }

        return vec4.copy(out, this[EveSOFDataFactionColorSet.Type[type]]);
    }

    /**
     * Usage index
     * TODO: Figure out how to automate this array
     * @type {string[]}
     */
    static Type = [
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
    ];

}


/**
 * Throws when a feature is not implemented
 */
export class ErrSOFFactionColorSetTypeUnknown extends Tw2Error
{
    constructor(data)
    {
        super(data, "SOF faction color set type unknown (%type%)");
        this.unknownType = true;
    }
}

/**
 * Throws when a feature is not implemented
 */
export class ErrSOFFactionColorSetTypeNotFound extends Tw2Error
{
    constructor(data)
    {
        super(data, "SOF faction color set type not found (%type%)");
    }
}
