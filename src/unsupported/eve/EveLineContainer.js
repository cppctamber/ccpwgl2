import { meta } from "utils";


/**
 * EveLineContainer
 *
 * @property {EveCurveLineSet} lineSet -
 */
@meta.notImplemented
@meta.type("EveLineContainer", true)
export class EveLineContainer extends meta.Model
{

    @meta.struct("EveCurveLineSet")
    lineSet = null;

}
