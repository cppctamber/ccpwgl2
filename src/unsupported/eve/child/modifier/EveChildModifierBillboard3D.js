import { meta } from "utils";
import { EveChildModifier } from "./EveChildModifier";


@meta.notImplemented
@meta.type("EveChildModifierBillboard3D")
@meta.define({
    wgl: "EveChildModifierBillboard3D",
    ccp: true
})
export class EveChildModifierBillboard3D extends EveChildModifier
{

    @meta.boolean
    fixed = false;

}
