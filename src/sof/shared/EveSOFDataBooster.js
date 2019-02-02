import {vec4} from "../../global";
import {Tw2BaseClass} from "../../global";

/**
 * EveSOFDataBooster
 *
 * @property {vec4} glowColor                    -
 * @property {Number} glowScale                  -
 * @property {String} gradient0ResPath           -
 * @property {String} gradient1ResPath           -
 * @property {vec4} haloColor                    -
 * @property {Number} haloScaleX                 -
 * @property {Number} haloScaleY                 -
 * @property {vec4} lightColor                   -
 * @property {Number} lightFlickerAmplitude      -
 * @property {Number} lightFlickerFrequency      -
 * @property {Number} lightRadius                -
 * @property {vec4} lightWarpColor               -
 * @property {Number} lightWarpRadius            -
 * @property {EveSOFDataBoosterShape} shape0     -
 * @property {EveSOFDataBoosterShape} shape1     -
 * @property {Number} shapeAtlasCount            -
 * @property {Number} shapeAtlasHeight           -
 * @property {String} shapeAtlasResPath          -
 * @property {Number} symHaloScale               -
 * @property {vec4} trailColor                   -
 * @property {vec4} trailSize                    -
 * @property {vec4} warpGlowColor                -
 * @property {vec4} warpHalpColor                -
 * @property {EveSOFDataBoosterShape} warpShape0 -
 * @property {EveSOFDataBoosterShape} warpShape1 -
 */
export class EveSOFDataBooster extends Tw2BaseClass
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

