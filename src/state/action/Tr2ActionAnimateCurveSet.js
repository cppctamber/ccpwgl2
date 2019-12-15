import { meta, Tw2BaseClass } from "global";


/**
 * Tr2ActionAnimateCurveSet
 *
 * @property {Tw2CurveSet} curveSet -
 * @property {String} value         -
 */
@meta.notImplemented
@meta.type("Tr2ActionAnimateCurveSet", true)
export class Tr2ActionAnimateCurveSet extends Tw2BaseClass
{

    @meta.black.object
    curveSet = null;

    @meta.black.string
    value = "";

}
