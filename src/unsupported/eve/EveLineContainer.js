import { meta, Tw2BaseClass } from "global";


/**
 * EveLineContainer
 *
 * @property {EveCurveLineSet} lineSet -
 */
@meta.notImplemented
@meta.ctor("EveLineContainer", true)
export class EveLineContainer extends Tw2BaseClass
{

    @meta.struct("EveCurveLineSet")
    lineSet = null;

}
