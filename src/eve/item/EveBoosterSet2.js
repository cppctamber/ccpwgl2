import { meta, vec4 } from "global";
import { Tw2RenderBatch } from "core";
import { EveObjectSet, EveObjectSetItem } from "./EveObjectSet";

/**
 * Eve booster set 2 render batch
 *
 * @property {EveBoosterSet2} boosterSet
 */
@meta.notImplemented
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
 * Booster set item
 */
@meta.notImplemented
@meta.type("EveBoosterSet2Item", true)
export class EveBoosterSet2Item extends EveObjectSetItem
{

}

/**
 * Booster set
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
@meta.notImplemented
@meta.type("EveBoosterSet2", true)
export class EveBoosterSet2 extends EveObjectSet
{

    @meta.black.boolean
    alwaysOn = false;

    @meta.black.float
    alwaysOnIntensity = 0;

    @meta.black.objectOf("Tw2Effect")
    effect = null;

    @meta.black.color
    glowColor = vec4.create();

    @meta.black.float
    glowScale = 0;

    @meta.black.object
    glows = null;

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

    @meta.black.float
    symHaloScale = 0;

    @meta.black.object
    trails = null;

    @meta.black.color
    warpGlowColor = vec4.create();

    @meta.black.color
    warpHaloColor = vec4.create();

}
