import { meta } from "utils";
import { vec4 } from "math";


@meta.type("EveSOFDataBooster")
export class EveSOFDataBooster
{

    @meta.color
    glowColor = vec4.create();

    @meta.float
    glowScale = 0;

    @meta.path
    gradient0ResPath = "";

    @meta.path
    gradient1ResPath = "";

    @meta.color
    haloColor = vec4.create();

    @meta.float
    haloScaleX = 0;

    @meta.float
    haloScaleY = 0;

    @meta.color
    lightColor = vec4.create();

    @meta.float
    lightFlickerAmplitude = 0;

    @meta.float
    lightFlickerFrequency = 0;

    @meta.float
    lightRadius = 0;

    @meta.color
    lightWarpColor = vec4.create();

    @meta.float
    lightWarpRadius = 0;

    @meta.struct("EveSOFDataBoosterShape")
    shape0 = null;

    @meta.struct("EveSOFDataBoosterShape")
    shape1 = null;

    @meta.uint
    shapeAtlasCount = 0;

    @meta.uint
    shapeAtlasHeight = 0;

    @meta.path
    shapeAtlasResPath = "";

    @meta.uint
    shapeAtlasWidth = 0;

    @meta.float
    symHaloScale = 0;

    @meta.color
    trailColor = vec4.create();

    @meta.vector4
    trailSize = vec4.create();

    @meta.color
    warpGlowColor = vec4.create();

    @meta.color
    warpHalpColor = vec4.create();

    @meta.struct("EveSOFDataBoosterShape")
    warpShape0 = null;

    @meta.struct("EveSOFDataBoosterShape")
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
