import { meta } from "utils";


@meta.define("EveSOFDataPatternLayerProperties", true)
export class EveSOFDataPatternLayerProperties extends meta.Model
{

    @meta.uint
    projectionTypeU = 0;

    @meta.uint
    projectionTypeV = 0;

    @meta.boolean
    isTargetMtl1 = true;

    @meta.boolean
    isTargetMtl2 = true;

    @meta.boolean
    isTargetMtl3 = true;

    @meta.boolean
    isTargetMtl4 = true;

    @meta.boolean
    Primary = true;

    @meta.boolean
    Glass = true;

    @meta.boolean
    Sails = true;

    @meta.boolean
    Reactor = true;

    @meta.boolean
    Darkhull = true;

    @meta.boolean
    Rock = true;

    @meta.boolean
    Monument = true;

    @meta.boolean
    Ornament = true;

    @meta.boolean
    SimplePrimary = true;

    /**
     * Checks whether the pattern layer applies to an SOF area type.
     * @param {number|string} areaType
     * @returns {boolean}
     */
    IsApplicableToArea(areaType)
    {
        const name = typeof areaType === "number" ? this.constructor.AreaTypes[areaType] : areaType;
        return name ? !!this[name] : true;
    }

    /**
     * The field each SOF area type index names, or null where a pattern layer
     * declares nothing for that type.
     *
     * Indexed by `EveSOFDataArea.AreaType`. Carbon maps NINE applicable areas -
     * TYPE_WRECK (5) and TYPE_TURRET (10) are absent, and default to applicable.
     * Omitting the gap at 5 shifted every type above it by one, so a pattern's
     * Rock flag was answering for wrecks, Monument for rocks, and so on.
     * @type {Array<String|null>}
     */
    static AreaTypes = [
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
        null
    ];

}
