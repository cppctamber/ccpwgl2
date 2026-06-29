import { meta } from "utils";


@meta.type("EveSOFDataPatternLayerProperties")
@meta.define({
    wgl: "EveSOFDataPatternLayerProperties",
    ccp: true
})
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

    @meta.boolean
    Wreck = true;

    @meta.boolean
    Turret = true;

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

    static AreaTypes = [
        "Primary",
        "Glass",
        "Sails",
        "Reactor",
        "Darkhull",
        "Rock",
        "Monument",
        "Ornament",
        "SimplePrimary",
        "Wreck",
        "Turret"
    ];

}
