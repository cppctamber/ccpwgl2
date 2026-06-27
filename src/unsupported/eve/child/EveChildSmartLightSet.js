import { meta } from "utils";
import { EveChild } from "eve/child";


@meta.notImplemented
@meta.type("EveChildSmartLightSet")
@meta.define({
    wgl: "EveChildSmartLightSet",
    ccp: true
})
export class EveChildSmartLightSet extends EveChild
{

    @meta.string
    name = "";

}
