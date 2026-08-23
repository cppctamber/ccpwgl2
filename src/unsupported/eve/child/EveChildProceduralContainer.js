import { meta } from "utils";
import { EveChild } from "eve/child";


@meta.notImplemented
@meta.define("EveChildProceduralContainer", true)
export class EveChildProceduralContainer extends EveChild
{

    @meta.string
    name = ""

    @meta.struct()
    selectionMethod = null;

}
