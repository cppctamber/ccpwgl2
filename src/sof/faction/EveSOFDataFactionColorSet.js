import { __get, meta } from "utils";
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

    @meta.color
    PrimarySpotlight = vec4.create();

    @meta.color
    SecondarySpotlight = vec4.create();

    @meta.color
    TertiarySpotlight = vec4.create();

    @meta.color
    PrimaryHologram = vec4.create();

    @meta.color
    SecondaryHologram = vec4.create();

    @meta.color
    TertiaryHologram = vec4.create();

    @meta.color
    State0 = vec4.create();

    @meta.color
    State1 = vec4.create();

    @meta.color
    State2 = vec4.create();

    @meta.color
    State3 = vec4.create();

    @meta.color
    StateVulnerable = vec4.create();

    @meta.color
    StateInvulnerable = vec4.create();

    @meta.color
    PrimaryForcefield = vec4.create();

    @meta.color
    SecondaryForcefield = vec4.create();

    @meta.color
    PrimaryBanner = vec4.create();

    @meta.color
    PrimaryBillboard = vec4.create();

    @meta.color
    PrimaryFx = vec4.create();

    @meta.color
    SecondaryFx = vec4.create();

    @meta.color
    PrimaryWarpFx = vec4.create();

    @meta.color
    PrimaryAttackFX = vec4.create();

    @meta.color
    PrimarySiegeFX = vec4.create();

    @meta.color
    PrimaryDockedFX = vec4.create();


    //_types = [];

    /**
     * Alias for ccp not following their normal casing
     * @returns {vec4}
     */
    get PrimaryAttackFx()
    {
        return this.PrimaryAttackFX;
    }

    /**
     * Alias for ccp not following their normal casing
     * @returns {vec4}
     */
    get PrimarySiegeFx()
    {
        return this.PrimarySiegeFX;
    }

    /**
     * Alias for ccp not following their normal casing
     * @returns {vec4}
     */
    get PrimaryDockedFx()
    {
        return this.PrimaryDockedFX;
    }

    /**
     * Checks if a color type exists
     * @param {Number} type
     * @returns {boolean}
     */
    Has(type)
    {
        const colorName = this.constructor.Type[type];
        if (!colorName) throw new ErrSOFFactionColorSetTypeUnknown({ type });
        return colorName in this;
    }

    /**
     * Gets a color type
     * @param {Number} type
     * @param {vec4} [out=vec4.create()]
     * @param {Number} [fallback] - Optional fallback colour
     * @return {vec4} out
     */
    Get(type, out = vec4.create(), fallback)
    {
        if (!this.Has(type))
        {
            if (fallback !== undefined && this.Has(fallback))
            {
                type = fallback;
            }
            else
            {
                throw new ErrSOFFactionColorSetTypeNotFound({ type });
            }
        }

        const colorName = this.constructor.Type[type];
        return vec4.copy(out, this[colorName]);
    }

    /**
     * A list of all the available color sets
     * WHO KNOWS HOW THESE ARE INDEXED!!!@#!@#!@#!@#!@#!@#!@
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
        "WhiteLight",
        "PrimaryHologram",
        "SecondaryHologram",
        "TertiaryHologram",
        "State0",
        "State1",
        "State2",
        "State3",
        "StateVulnerable",
        "StateInvulnerable",
        "PrimaryForcefield",
        "SecondaryForcefield",
        "PrimaryBanner",
        "PrimaryFx",
        "SecondaryFx",
        "PrimarySpotlight",
        "SecondarySpotlight",
        "TertiarySpotlight",
        "PrimaryBillboard",
        "PrimaryWarpFx",
        "PrimaryAttackFX",
        "PrimarySiegeFX",
        "PrimaryDockedFX"
    ];


    /**
     * Custom black property reader which is fired after each read of this object
     * @param {String} property - The property being read
     * @param {Object} value    - The value returned
     * @param {Object} parent   - The object that the property and value belongs to
     */
    /*
    static onAfterBlackPropertyReader(property, value, parent)
    {
        if (!parent._count) parent._count = 0;
        if (!parent._test) parent._test = [];
        parent._test.push({ property, value, count: parent._count++ });
        parent._types.push(property);
    }
     */

    /**
     *
     * @param {EveSOFDataFactionColorSet} a
     * @param {EveSOFDataFactionColorSet} b
     * @param {EveSOFDataFactionColorSet} out
     * @returns {EveSOFDataFactionColorSet}
     */
    static combine(a, b, out)
    {
        out = out || new this();
        if (!a) a = out;
        this.Type.forEach(type => vec4.copy(out[type], __get(b, type, a)));
        return out;
    }

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
