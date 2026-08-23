import { meta } from "utils";
import { EveChild } from "eve/child";


@meta.notImplemented
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
