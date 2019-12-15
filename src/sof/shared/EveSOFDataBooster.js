import { meta, vec4 } from "global";


@meta.type("EveSOFDataBooster", true)
export class EveSOFDataBooster
{

    @meta.black.color
    glowColor = vec4.create();

    @meta.black.float
    glowScale = 0;

    @meta.black.path
    gradient0ResPath = "";

    @meta.black.path
    gradient1ResPath = "";

    @meta.black.color
    haloColor = vec4.create();

    @meta.black.float
    haloScaleX = 0;

    @meta.black.float
    haloScaleY = 0;

    @meta.black.color
    lightColor = vec4.create();

    @meta.black.float
    lightFlickerAmplitude = 0;

    @meta.black.float
    lightFlickerFrequency = 0;

    @meta.black.float
    lightRadius = 0;

    @meta.black.color
    lightWarpColor = vec4.create();

    @meta.black.float
    lightWarpRadius = 0;

    @meta.black.objectOf("EveSOFDataBoosterShape")
    shape0 = null;

    @meta.black.objectOf("EveSOFDataBoosterShape")
    shape1 = null;

    @meta.black.uint
    shapeAtlasCount = 0;

    @meta.black.uint
    shapeAtlasHeight = 0;

    @meta.black.path
    shapeAtlasResPath = "";

    @meta.black.uint
    shapeAtlasWidth = 0;

    @meta.black.float
    symHaloScale = 0;

    @meta.black.color
    trailColor = vec4.create();

    @meta.black.vector4
    trailSize = vec4.create();

    @meta.black.color
    warpGlowColor = vec4.create();

    @meta.black.color
    warpHalpColor = vec4.create();

    @meta.black.objectOf("EveSOFDataBoosterShape")
    warpShape0 = null;

    @meta.black.objectOf("EveSOFDataBoosterShape")
    warpShape1 = null;

    /**
     * Alias for `warpHalpColor` (ccp typo)
     * @returns {vec4}
     */
    get warpHaloColor()
    {
        return this.warpHalpColor;
    }

    /**
     * Alias for `warpHalpColor` (ccp typo)
     * @param {vec4} v
     */
    set warpHaloColor(v)
    {
        this.warpHalpColor = v;
    }

}
