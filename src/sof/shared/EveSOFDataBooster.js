import { __get, isNoU, meta } from "utils";
import { vec4 } from "math";
import { EveSOFDataBoosterShape } from "sof";


@meta.type("EveSOFDataBooster")
export class EveSOFDataBooster extends meta.Model
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

    /**
     *
     * @param {EveSOFDataBooster} a
     * @param {EveSOFDataBooster} b
     * @param {EveSOFDataBooster} [out=new EveSOFDataBooster]
     * @returns {EveSOFDataBooster}
     */
    static combine(a, b, out)
    {
        out = out || new this();
        if (!a && !b) return out;
        if (!a) a = out;
        vec4.copy(out.glowColor, __get(b, "glowColor", a));
        out.glowScale = __get(b, "glowScale", a);
        out.gradient0ResPath = __get(b, "gradient0ResPath", a);
        out.gradient1ResPath = __get(b, "gradient1ResPath", a);
        vec4.copy(out.haloColor, __get(b, "haloColor", a));
        out.haloScaleX = __get(b, "haloScaleX", a);
        out.haloScaleY = __get(b, "haloScaleY", a);
        vec4.copy(out.lightColor, __get(b, "lightColor", a));
        out.lightFlickerAmplitude = __get(b, "lightFlickerAmplitude", a);
        out.lightFlickerFrequency = __get(b, "lightFlickerFrequency", a);
        out.lightRadius = __get(b, "lightRadius", a);
        vec4.copy(out.lightWarpColor, __get(b, "lightWarpColor", a));
        out.lightWarpRadius = __get(b, "lightWarpRadius", a);
        out.shape0 = EveSOFDataBoosterShape.combine(a.shape0, b ? b.shape0 : null, out.shape0);
        out.shape1 = EveSOFDataBoosterShape.combine(a.shape1, b ? b.shape1 : null, out.shape1);
        out.shapeAtlasCount = __get(b, "shapeAtlasCount", a);
        out.shapeAtlasHeight = __get(b, "shapeAtlasHeight", a);
        out.shapeAtlasResPath = __get(b, "shapeAtlasResPath", a);
        out.shapeAtlasWidth = __get(b, "shapeAtlasWidth", a);
        out.symHaloScale = __get(b, "symHaloScale", a);
        vec4.copy(out.trailColor, __get(b, "trailColor", a));
        vec4.copy(out.trailSize, __get(b, "trailSize", a));
        vec4.copy(out.warpGlowColor, __get(b, "warpGlowColor", a));
        vec4.copy(out.warpHalpColor, __get(b, "warpHalpColor", a));
        out.warpShape0 = EveSOFDataBoosterShape.combine(a.warpShape0, b ? b.warpShape0 : null, out.warpShape0);
        out.warpShape1 = EveSOFDataBoosterShape.combine(a.warpShape1, b ? b.warpShape1 : null, out.warpShape1);
        return out;
    }

}
