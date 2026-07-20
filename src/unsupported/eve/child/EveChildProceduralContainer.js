import { meta } from "utils";
import { EveChild } from "eve/child";


@meta.notImplemented
@meta.type("EveChildProceduralContainer")
@meta.define({
    wgl: "EveChildProceduralContainer",
    ccp: true
})
export class EveChildProceduralContainer extends EveChild
{

    @meta.string
    name = ""

    @meta.struct()
    selectionMethod = null;

}
