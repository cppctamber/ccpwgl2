import { meta } from "global";


/**
 * EveLineContainer
 *
 * @property {EveCurveLineSet} lineSet -
 */
@meta.notImplemented
@meta.ctor("EveLineContainer", true)
export class EveLineContainer extends meta.Model
{

    @meta.struct("EveCurveLineSet")
    lineSet = null;

}
