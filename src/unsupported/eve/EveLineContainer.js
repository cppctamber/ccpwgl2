import { meta, Tw2BaseClass } from "global";


/**
 * EveLineContainer
 *
 * @property {EveCurveLineSet} lineSet -
 */
@meta.notImplemented
@meta.type("EveLineContainer", true)
export class EveLineContainer extends Tw2BaseClass
{

    @meta.black.object
    lineSet = null;

}
