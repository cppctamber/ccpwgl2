import { vec4, Tw2BaseClass } from "../../global";
import { Tw2RenderBatch } from "../../core";
import { EveObjectSet, EveObjectSetItem } from "./EveObjectSet";

/**
 * Eve booster set 2 render batch
 * @ccp N/A
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
 * Booster
 * TODO: Implement
 * @ccp N/A
 */
export class EveBoosterSet2Item extends EveObjectSetItem
{

    /**
     * Identifies that the class is in staging
     * @property {null|Number}
     */
    static __isStaging = 4;

}

/**
 * Booster set
 * TODO: Implement
 * @ccp EveBoosterSet2
 *
 * @property {Boolean} alwaysOn             -
 * @property {Number} alwaysOnIntensity     -
 * @property {Tw2Effect} effect             -
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
export class EveBoosterSet2 extends EveObjectSet
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

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            [ "alwaysOn", r.boolean ],
            [ "alwaysOnIntensity", r.float ],
            [ "effect", r.object ],
            [ "glows", r.object ],
            [ "glowColor", r.color ],
            [ "glowScale", r.float ],
            [ "haloColor", r.color ],
            [ "haloScaleX", r.float ],
            [ "haloScaleY", r.float ],
            [ "lightFlickerAmplitude", r.float ],
            [ "lightFlickerColor", r.color ],
            [ "lightFlickerFrequency", r.float ],
            [ "lightFlickerRadius", r.float ],
            [ "lightColor", r.color ],
            [ "lightRadius", r.float ],
            [ "lightWarpColor", r.color ],
            [ "lightWarpRadius", r.float ],
            [ "symHaloScale", r.float ],
            [ "trails", r.object ],
            [ "warpGlowColor", r.color ],
            [ "warpHaloColor", r.color ]
        ];
    }

    /**
     * Identifies that the class is in staging
     * @property {null|Number}
     */
    static __isStaging = 4;

}
