import { meta, Tw2BaseClass } from "global";


/**
 * Tr2ActionPlayCurveSet
 *
 * @property {String} curveSetName -
 * @property {String} rangeName    -
 * @property {Boolean} syncToRange -
 */
@meta.notImplemented
@meta.type("Tr2ActionPlayCurveSet", true)
export class Tr2ActionPlayCurveSet extends Tw2BaseClass
{

    @meta.black.string
    curveSetName = "";

    @meta.black.string
    rangeName = "";

    @meta.black.boolean
    syncToRange = false;

}
