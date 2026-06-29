import { meta } from "utils";
import { EveChild } from "eve/child";
import { Tw2CurveScalarKey } from "unsupported/curve";
import { vec3 } from "math";


@meta.notImplemented
@meta.uiDesc("Specialized explosion propagator object child")
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
    @meta.uiGroup("SpawnSettings")
    @meta.uiDesc("Range: [0:1]. Use if you don't want 100% of a locator set. Doesn't work for randomSpread")
    @meta.ui({ minValue: 0, maxValue: 1, step: 0.01 })
    completeness = 1;

    @meta.float
    @meta.uiGroup("intervalTriggers")
    @meta.uiDesc("How long until per instance cleanup")
    @meta.ui({ minValue: 0, step: 0.1 })
    durationPerEffect = 3;

    @meta.struct("Tw2Effect")
    @meta.uiDesc("The instance container that manages the instances")
    effect = null;

    @meta.vector3
    @meta.uiGroup("SpawnSettings")
    @meta.uiDesc("General Vec3 to enlarge the effects on spawn")
    effectScaling = vec3.fromValues(1, 1, 1);

    @meta.float
    @meta.uiGroup("intervalTriggers")
    @meta.uiDesc("Triggers per second")
    @meta.ui({ minValue: 0, step: 0.1 })
    frequency = 1;

    @meta.struct()
    @meta.uiDesc("Locators for a self-contained propagation")
    localLocators = null;

    @meta.string
    @meta.uiGroup("ExternalLocatorSet")
    @meta.uiDesc("Name of the locator set")
    locatorSetName = "";

    @meta.list(Tw2CurveScalarKey)
    keys = [];

    @meta.float
    maxLifeTime = 0;

    @meta.int64
    @meta.uiGroup("RandomLocators")
    @meta.uiDesc("Total number of spawned locators")
    @meta.ui({ minValue: 0, step: 1 })
    numTriggers = 10;

    @meta.float
    @meta.uiGroup("RandomLocators")
    @meta.uiDesc("Total range locators can spawn in")
    @meta.ui({ minValue: 0, step: 1 })
    range = 500;

    @meta.float
    @meta.uiGroup("RandomLocators")
    @meta.uiDesc("Should locators always spawn at least this many meters away from center?")
    @meta.ui({ minValue: 0, step: 1 })
    minRangeThreshold = 0;

    @meta.float
    @meta.uiGroup("RandomLocators")
    @meta.uiDesc("Distribution point. Closer to 0/1 produces more similar placement")
    @meta.ui({ minValue: 0, maxValue: 1, step: 0.01 })
    ClosenessPreference = 0.25;

    @meta.uint
    @meta.uiDesc("Propagation mode: local locators, external locator set, or random spread")
    @meta.ui({ widget: "select" })
    propagationType = 0;

    @meta.float
    @meta.uiGroup("SpawnSettings")
    @meta.uiDesc("Additional randomness: maximum scaling range")
    @meta.ui({ minValue: 0, step: 0.1 })
    randScaleMax = 1;

    @meta.float
    @meta.uiGroup("SpawnSettings")
    @meta.uiDesc("Additional randomness: minimum scaling range")
    @meta.ui({ minValue: 0, step: 0.1 })
    randScaleMin = 1;

    @meta.boolean
    @meta.uiGroup("Looping (TriggerSphereCurve)")
    @meta.uiDesc("Replay after curve finishes playing plus stopToClearDelay; mutually exclusive with skipCleanup")
    replayAfterDelay = false;

    @meta.boolean
    @meta.uiGroup("Looping (TriggerSphereCurve)")
    @meta.uiDesc("Only propagate once and then idle the propagator; mutually exclusive with replayAfterDelay")
    skipCleanup = false;

    @meta.float
    @meta.uiGroup("Looping (TriggerSphereCurve)")
    @meta.uiDesc("Delay between curve finished playing and the end")
    @meta.ui({ minValue: 0, step: 0.1 })
    stopToClearDelay = 0;

    @meta.float
    @meta.uiGroup("intervalTriggers")
    @meta.uiDesc("-1 to never stop; otherwise stops after this many creations")
    @meta.ui({ minValue: -1, step: 1 })
    stopAfterNumTriggers = -1;

    @meta.boolean
    @meta.uiDesc("Reset and start")
    trigger = false;

    @meta.uint
    @meta.uiDesc("Trigger mode: trigger sphere curve, interval triggers, or instant permanent")
    @meta.ui({ widget: "select" })
    triggerMethood = 0;

    @meta.vector3
    @meta.uiGroup("SpawnSettings")
    @meta.uiDesc("Centerpoint of the trigger sphere")
    triggerSphereOffset = vec3.create();

    @meta.struct()
    @meta.uiDesc("Manage the triggering of effects based on distance from triggerSphereOffset")
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
