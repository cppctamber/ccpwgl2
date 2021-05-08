import { meta } from "utils";
import { EveChild } from "eve/child";
import { vec4, quat } from "math";
import { Tw2CurveScalarKey } from "unsupported/curve";


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

    @meta.float
    triggerSphereRadiusCurve = null;

    @meta.float
    turbulenceAmplitude = null;

    //localLocators = null;

}
