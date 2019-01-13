import {vec4, Tw2BaseClass} from "../../global";
import {Tw2RenderBatch} from "../../core";

/**
 * Eve booster set 2 render batch
 *
 * @property {EveBoosterSet2} boosterSet
 */
export class EveBoosterSet2Batch extends Tw2RenderBatch
{

    boosterSet = null;

    /**
     * Commits the batch
     * @param {String} technique - technique name
     */
    Commit(technique)
    {
        this.boosterSet.Render(technique);
    }
}

/**
 * EveBoosterSet2Item
 * @ccp N/A
 * TODO: Implement
 */
export class EveBoosterSet2Item extends Tw2BaseClass
{

}

Tw2BaseClass.define(EveBoosterSet2Item, Type =>
{
    return {
        type: "EveBoosterSet2Item",
        staging: true,
        notImplemented: ["*"]
    };
});

/**
 * EveBoosterSet2
 * @implements EveObjectSet
 * TODO: Implement
 *
 * @property {Boolean} alwaysOn             -
 * @property {Number} alwaysOnIntensity     -
 * @property {Tr2Effect} effect             -
 * @property {vec4} glowColor               -
 * @property {Number} glowScale             -
 * @property {EveSpriteSet} glows           -
 * @property {vec4} haloColor               -
 * @property {Number} haloScaleX            -
 * @property {Number} haloScaleY            -
 * @property {vec4} lightColor              -
 * @property {Number} lightFlickerAmplitude -
 * @property {Number} lightFlickerFrequency -
 * @property {Number} lightRadius           -
 * @property {vec4} lightWarpColor          -
 * @property {Number} lightWarpRadius       -
 * @property {Number} symHaloScale          -
 * @property {EveTrailsSet} trails          -
 * @property {vec4} warpGlowColor           -
 * @property {vec4} warpHaloColor           -
 */
export class EveBoosterSet2 extends Tw2BaseClass
{

    alwaysOn = false;
    alwaysOnIntensity = 0;
    effect = null;
    glowColor = vec4.create();
    glowScale = 0;
    glows = null;
    haloColor = vec4.create();
    haloScaleX = 0;
    haloScaleY = 0;
    lightColor = vec4.create();
    lightFlickerAmplitude = 0;
    lightFlickerFrequency = 0;
    lightRadius = 0;
    lightWarpColor = vec4.create();
    lightWarpRadius = 0;
    symHaloScale = 0;
    trails = null;
    warpGlowColor = vec4.create();
    warpHaloColor = vec4.create();

}

Tw2BaseClass.define(EveBoosterSet2, Type =>
{
    return {
        isStaging: true,
        type: "EveBoosterSet2",
        category: "EveObjectSet",
        props: {
            alwaysOn: Type.BOOLEAN,
            alwaysOnIntensity: Type.NUMBER,
            effect: ["Tr2Effect"],
            glowColor: Type.RGBA_LINEAR,
            glowScale: Type.NUMBER,
            glows: ["EveSpriteSet"],
            haloColor: Type.RGBA_LINEAR,
            haloScaleX: Type.NUMBER,
            haloScaleY: Type.NUMBER,
            lightColor: Type.RGBA_LINEAR,
            lightFlickerAmplitude: Type.NUMBER,
            lightFlickerFrequency: Type.NUMBER,
            lightRadius: Type.NUMBER,
            lightWarpColor: Type.RGBA_LINEAR,
            lightWarpRadius: Type.NUMBER,
            symHaloScale: Type.NUMBER,
            trails: ["EveTrailsSet"],
            warpGlowColor: Type.RGBA_LINEAR,
            warpHaloColor: Type.RGBA_LINEAR
        },
        notImplemented: ["*"]
    };
});

