import { meta } from "utils";
import { EveChild } from "eve/child";
import { Tw2CurveScalarKey } from "unsupported/curve";
import { EveLocator2 } from "eve";


@meta.notImplemented
@meta.type("EveChildEffectPropagator", true)
export class EveChildEffectPropagator extends EveChild
{

    @meta.string
    name = "";

    @meta.struct("Tw2Effect")
    effect = null;

    @meta.list(Tw2CurveScalarKey)
    keys = [];

    @meta.float
    maxLifeTime = 0;

    @meta.struct()
    triggerSphereRadiusCurve = null;

    @meta.float
    turbulenceAmplitude = 0;

}
