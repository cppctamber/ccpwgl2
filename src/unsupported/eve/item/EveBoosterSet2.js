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
@meta.type("EveBoosterSet2Item", true)
export class EveBoosterSet2Item extends EveObjectSetItem
{

}


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

    @meta.black.objectOf("EveSpriteSet")
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

    @meta.black.objectOf("EveTrailsSet")
    trails = null;

    @meta.black.color
    warpGlowColor = vec4.create();

    @meta.black.color
    warpHaloColor = vec4.create();

}
