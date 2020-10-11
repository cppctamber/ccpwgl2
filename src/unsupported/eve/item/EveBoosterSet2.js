import { meta, vec4 } from "global";
import { Tw2RenderBatch } from "core";
import { EveObjectSet, EveObjectSetItem } from "eve";


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


@meta.notImplemented
@meta.ctor("EveBoosterSet2Item")
export class EveBoosterSet2Item extends EveObjectSetItem
{

}


@meta.notImplemented
@meta.ctor("EveBoosterSet2")
export class EveBoosterSet2 extends EveObjectSet
{

    @meta.boolean
    alwaysOn = false;

    @meta.float
    alwaysOnIntensity = 0;

    @meta.struct("Tw2Effect")
    effect = null;

    @meta.color
    glowColor = vec4.create();

    @meta.float
    glowScale = 0;

    @meta.struct("EveSpriteSet")
    glows = null;

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

    @meta.float
    symHaloScale = 0;

    @meta.struct("EveTrailsSet")
    trails = null;

    @meta.color
    warpGlowColor = vec4.create();

    @meta.color
    warpHaloColor = vec4.create();

}
