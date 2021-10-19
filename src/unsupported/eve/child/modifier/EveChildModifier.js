import { meta } from "utils";
import { mat4 } from "math";


@meta.type("EveChildModifier")
export class EveChildModifier extends meta.Model
{

    static global = {
        mat4_0: mat4.create()
    }

}
