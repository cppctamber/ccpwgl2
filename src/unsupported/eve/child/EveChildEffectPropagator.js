import { meta } from "utils";
import { EveChild } from "eve/child";
import { Tw2CurveScalarKey } from "unsupported/curve";
import { vec3 } from "math";


@meta.notImplemented
@meta.type("EveChildEffectPropagator", true)
@meta.define({
    wgl: "EveChildEffectPropagator",
    ccp: true
})
export class EveChildEffectPropagator extends EveChild
{

    @meta.string
    name = "";

    @meta.float
    completeness = 1;

    @meta.float
    durationPerEffect = 3;

    @meta.struct("Tw2Effect")
    effect = null;

    @meta.vector3
    effectScaling = vec3.fromValues(1, 1, 1);

    @meta.float
    frequency = 1;

    @meta.struct()
    localLocators = null;

    @meta.string
    locatorSetName = "";

    @meta.list(Tw2CurveScalarKey)
    keys = [];

    @meta.float
    maxLifeTime = 0;

    @meta.int64
    numTriggers = 10;

    @meta.float
    range = 500;

    @meta.float
    minRangeThreshold = 0;

    @meta.float
    ClosenessPreference = 0.25;

    @meta.uint
    propagationType = 0;

    @meta.float
    randScaleMax = 1;

    @meta.float
    randScaleMin = 1;

    @meta.boolean
    replayAfterDelay = false;

    @meta.boolean
    skipCleanup = false;

    @meta.float
    stopToClearDelay = 0;

    @meta.float
    stopAfterNumTriggers = -1;

    @meta.boolean
    trigger = false;

    @meta.uint
    triggerMethood = 0;

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
        this.triggerMethood = struct;
    }

}
