import { meta } from "utils";
import { EveChild } from "eve/child";
import { Tw2CurveScalarKey } from "unsupported/curve";
import { vec3 } from "math";


@meta.notImplemented
@meta.type("EveChildEffectPropagator", true)
export class EveChildEffectPropagator extends EveChild
{

    @meta.string
    name = "";

    @meta.float
    completeness = 0;

    @meta.float
    durationPerEffect = 0;

    @meta.struct("Tw2Effect")
    effect = null;

    @meta.vector3
    effectScaling = vec3.create();

    @meta.float
    frequency = 0;

    @meta.struct()
    localLocators = null;

    @meta.string
    locatorSetName = "";

    @meta.list(Tw2CurveScalarKey)
    keys = [];

    @meta.float
    maxLifeTime = 0;

    @meta.uint
    propagationType = 0;

    @meta.float
    randScaleMax = 0;

    @meta.float
    randScaleMin = 0;

    @meta.boolean
    replayAfterDelay = false;

    @meta.boolean
    skipCleanup = false;

    @meta.float
    stopToClearDelay = 0;

    @meta.uint
    stopAfterNumTriggers = 0;

    @meta.boolean
    trigger = false;

    @meta.struct()
    triggerMethood = null;

    @meta.vector3
    triggerSphereOffset = vec3.create();

    @meta.struct()
    triggerSphereRadiusCurve = null;

    @meta.float
    turbulenceAmplitude = 0;

    /**
     * Alias for binary spelling mistake
     * @returns {*}
     */
    get triggerMethod()
    {
        return this.triggerMethood;
    }

    /**
     * Alias for binary spelling mistake
     * @param {*} struct
     */
    set triggerMethod(struct)
    {
        this.triggerMethod = struct;
    }

}
