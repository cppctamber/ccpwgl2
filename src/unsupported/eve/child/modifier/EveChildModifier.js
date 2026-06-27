import { meta } from "utils";
import { mat4 } from "math";


@meta.type("EveChildModifier")
@meta.define({
    wgl: "EveChildModifier",
    ccp: true
})
export class EveChildModifier extends meta.Model
{

    static global = {
        mat4_0: mat4.create()
    }

}
