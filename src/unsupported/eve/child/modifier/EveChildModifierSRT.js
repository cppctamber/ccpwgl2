import { quat, vec3, meta } from "global";
import { EveChildModifier } from "./EveChildModifier";


@meta.notImplemented
@meta.type("EveChildModifierSRT", true)
export class EveChildModifierSRT extends EveChildModifier
{

    @meta.black.quaternion
    rotation = quat.create();

    @meta.black.vector3
    scaling = vec3.fromValues(1, 1, 1);

    @meta.black.vector3
    translation = vec3.create();

}
