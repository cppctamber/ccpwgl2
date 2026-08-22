import { __get, meta } from "utils";
import { vec4 } from "math";
import { Tw2Error } from "core";


@meta.type("EveSOFDataFactionColorSet")
@meta.define({
    wgl: "EveSOFDataFactionColorSet",
    ccp: true
})
export class EveSOFDataFactionColorSet extends meta.Model
{

    /*
     * Defaults, from Carbon's constructor (`EveSOFData.cpp:42-52`):
     *
     *     std::fill( begin, end, Color( 0, 0, 0, 1 ) );
     *     m_colors[TYPE_PRIMARY_BILLBOARD] = Color( 2.5f, 2.5f, 2.5f, 2.5f );
     *     m_colors[TYPE_PRIMARY_WARP_FX]   = Color( 0xFFFF6333 );
     *     m_colors[TYPE_PRIMARY_DOCKED_FX] = Color( 0xFF4C82E2 );
     *     m_colors[TYPE_PRIMARY_ATTACK_FX] = Color( 0xFFFF180B );
     *     m_colors[TYPE_PRIMARY_SIEGE_FX]  = Color( 0xFFFF5E2D );
     *
     * Every slot is black at ALPHA 1, and five carry an authored default. The
     * hex values are ARGB and are used as-is, no gamma conversion: each decodes
     * to exactly what runtime-sof resolves and what tools-core serves, which is
     * how the byte order was confirmed rather than assumed.
     *
     * These were all `vec4.create()` - black at alpha ZERO - so any colour a
     * faction does not author rendered black. Published faction data does not
     * carry the four FX colours at all, so on a live hull the warp, attack and
     * siege lights went dark while every other consumer of the same data showed
     * them correctly. `PrimaryBillboard` is the other visible one: it is HDR
     * white at 2.5, not black.
     *
     * `Has()` cannot help here - every colour is a declared field, so it is
     * always true and `GetColorType`'s fallback branch is unreachable. The
     * defaults ARE the fallback, which is how Carbon does it too.
     */

    @meta.color
    Black = vec4.fromValues(0, 0, 0, 1);

    @meta.color
    Blue = vec4.fromValues(0, 0, 0, 1);

    @meta.color
    Booster = vec4.fromValues(0, 0, 0, 1);

    @meta.color
    Cyan = vec4.fromValues(0, 0, 0, 1);

    @meta.color
    Darkhull = vec4.fromValues(0, 0, 0, 1);

    @meta.color
    Fire = vec4.fromValues(0, 0, 0, 1);

    @meta.color
    Glass = vec4.fromValues(0, 0, 0, 1);

    @meta.color
    Green = vec4.fromValues(0, 0, 0, 1);

    @meta.color
    Hull = vec4.fromValues(0, 0, 0, 1);

    @meta.color
    Killmark = vec4.fromValues(0, 0, 0, 1);

    @meta.color
    Orange = vec4.fromValues(0, 0, 0, 1);

    @meta.color
    Primary = vec4.fromValues(0, 0, 0, 1);

    @meta.color
    PrimaryLight = vec4.fromValues(0, 0, 0, 1);

    @meta.color
    Reactor = vec4.fromValues(0, 0, 0, 1);

    @meta.color
    Red = vec4.fromValues(0, 0, 0, 1);

    @meta.color
    Secondary = vec4.fromValues(0, 0, 0, 1);

    @meta.color
    SecondaryLight = vec4.fromValues(0, 0, 0, 1);

    @meta.color
    Tertiary = vec4.fromValues(0, 0, 0, 1);

    @meta.color
    TertiaryLight = vec4.fromValues(0, 0, 0, 1);

    @meta.color
    White = vec4.fromValues(0, 0, 0, 1);

    @meta.color
    WhiteLight = vec4.fromValues(0, 0, 0, 1);

    @meta.color
    Yellow = vec4.fromValues(0, 0, 0, 1);

    @meta.color
    PrimarySpotlight = vec4.fromValues(0, 0, 0, 1);

    @meta.color
    SecondarySpotlight = vec4.fromValues(0, 0, 0, 1);

    @meta.color
    TertiarySpotlight = vec4.fromValues(0, 0, 0, 1);

    @meta.color
    PrimaryHologram = vec4.fromValues(0, 0, 0, 1);

    @meta.color
    SecondaryHologram = vec4.fromValues(0, 0, 0, 1);

    @meta.color
    TertiaryHologram = vec4.fromValues(0, 0, 0, 1);

    @meta.color
    State0 = vec4.fromValues(0, 0, 0, 1);

    @meta.color
    State1 = vec4.fromValues(0, 0, 0, 1);

    @meta.color
    State2 = vec4.fromValues(0, 0, 0, 1);

    @meta.color
    State3 = vec4.fromValues(0, 0, 0, 1);

    @meta.color
    StateVulnerable = vec4.fromValues(0, 0, 0, 1);

    @meta.color
    StateInvulnerable = vec4.fromValues(0, 0, 0, 1);

    @meta.color
    PrimaryForcefield = vec4.fromValues(0, 0, 0, 1);

    @meta.color
    SecondaryForcefield = vec4.fromValues(0, 0, 0, 1);

    @meta.color
    PrimaryBanner = vec4.fromValues(0, 0, 0, 1);

    @meta.color
    PrimaryBillboard = vec4.fromValues(2.5, 2.5, 2.5, 2.5);

    @meta.color
    PrimaryFx = vec4.fromValues(0, 0, 0, 1);

    @meta.color
    SecondaryFx = vec4.fromValues(0, 0, 0, 1);

    @meta.color
    PrimaryWarpFx = vec4.fromValues(1, 99 / 255, 51 / 255, 1);

    @meta.color
    PrimaryAttackFX = vec4.fromValues(1, 24 / 255, 11 / 255, 1);

    @meta.color
    PrimarySiegeFX = vec4.fromValues(1, 94 / 255, 45 / 255, 1);

    @meta.color
    PrimaryDockedFX = vec4.fromValues(76 / 255, 130 / 255, 226 / 255, 1);


    //_types = [];

    /**
     * Alias for ccp not following their normal casing
     * @returns {vec4}
     */
    @meta.alias("PrimaryAttackFX")
    get PrimaryAttackFx()
    {
        return this.PrimaryAttackFX;
    }

    /**
     * Alias for ccp not following their normal casing
     * @returns {vec4}
     */
    @meta.alias("PrimarySiegeFX")
    get PrimarySiegeFx()
    {
        return this.PrimarySiegeFX;
    }

    /**
     * Alias for ccp not following their normal casing
     * @returns {vec4}
     */
    @meta.alias("PrimaryDockedFX")
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
     * @param {vec4} out
     * @param {Number} [fallback] - Optional fallback colour
     * @return {vec4} out
     */
    Get(type, out, fallback)
    {
        if (!out)
        {
            throw new TypeError("Get requires an output vector");
        }

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
     * Every available colour, in `SOFDataFactionColorChooser::ColorType` order.
     *
     * Verified index for index against Carbon's enum (EveSOFData.h:145-193):
     * zero-based, 44 entries, `PrimaryLight` at 18, `SecondaryLight` at 19,
     * `TertiaryLight` at 20. The order is the wire contract - a `factionColor`
     * int in a .black indexes THIS list, so entries may never be reordered or
     * inserted into.
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
