import {vec4} from "../../../global";
import {Tw2BaseClass} from "../../class";

/**
 * EveSOFDataBooster
 *
 * @parameter {vec4} glowColor                    -
 * @parameter {Number} glowScale                  -
 * @parameter {String} gradient0ResPath           -
 * @parameter {String} gradient1ResPath           -
 * @parameter {vec4} haloColor                    -
 * @parameter {Number} haloScaleX                 -
 * @parameter {Number} haloScaleY                 -
 * @parameter {vec4} lightColor                   -
 * @parameter {Number} lightFlickerAmplitude      -
 * @parameter {Number} lightFlickerFrequency      -
 * @parameter {Number} lightRadius                -
 * @parameter {vec4} lightWarpColor               -
 * @parameter {Number} lightWarpRadius            -
 * @parameter {EveSOFDataBoosterShape} shape0     -
 * @parameter {EveSOFDataBoosterShape} shape1     -
 * @parameter {Number} shapeAtlasCount            -
 * @parameter {Number} shapeAtlasHeight           -
 * @parameter {String} shapeAtlasResPath          -
 * @parameter {Number} symHaloScale               -
 * @parameter {vec4} trailColor                   -
 * @parameter {vec4} trailSize                    -
 * @parameter {vec4} warpGlowColor                -
 * @parameter {vec4} warpHalpColor                -
 * @parameter {EveSOFDataBoosterShape} warpShape0 -
 * @parameter {EveSOFDataBoosterShape} warpShape1 -
 */
export default class EveSOFDataBooster extends Tw2BaseClass
{

    glowColor = vec4.create();
    glowScale = 0;
    gradient0ResPath = "";
    gradient1ResPath = "";
    haloColor = vec4.create();
    haloScaleX = 0;
    haloScaleY = 0;
    lightColor = vec4.create();
    lightFlickerAmplitude = 0;
    lightFlickerFrequency = 0;
    lightRadius = 0;
    lightWarpColor = vec4.create();
    lightWarpRadius = 0;
    shape0 = null;
    shape1 = null;
    shapeAtlasCount = 0;
    shapeAtlasHeight = 0;
    shapeAtlasResPath = "";
    symHaloScale = 0;
    trailColor = vec4.create();
    trailSize = vec4.create();
    warpGlowColor = vec4.create();
    warpHalpColor = vec4.create();
    warpShape0 = null;
    warpShape1 = null;

}

Tw2BaseClass.define(EveSOFDataBooster, Type =>
{
    return {
        isStaging: true,
        type: "EveSOFDataBooster",
        props: {
            glowColor: Type.RGBA_LINEAR,
            glowScale: Type.NUMBER,
            gradient0ResPath: Type.PATH,
            gradient1ResPath: Type.PATH,
            haloColor: Type.RGBA_LINEAR,
            haloScaleX: Type.NUMBER,
            haloScaleY: Type.NUMBER,
            lightColor: Type.RGBA_LINEAR,
            lightFlickerAmplitude: Type.NUMBER,
            lightFlickerFrequency: Type.NUMBER,
            lightRadius: Type.NUMBER,
            lightWarpColor: Type.RGBA_LINEAR,
            lightWarpRadius: Type.NUMBER,
            shape0: ["EveSOFDataBoosterShape"],
            shape1: ["EveSOFDataBoosterShape"],
            shapeAtlasCount: Type.NUMBER,
            shapeAtlasHeight: Type.NUMBER,
            shapeAtlasResPath: Type.PATH,
            symHaloScale: Type.NUMBER,
            trailColor: Type.RGBA_LINEAR,
            trailSize: Type.VECTOR4,
            warpGlowColor: Type.RGBA_LINEAR,
            warpHalpColor: Type.RGBA_LINEAR,
            warpShape0: ["EveSOFDataBoosterShape"],
            warpShape1: ["EveSOFDataBoosterShape"]
        }
    };
});

