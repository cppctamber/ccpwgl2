import { quat, vec3, meta } from "global";
import { EveChildModifier } from "./EveChildModifier";


@meta.notImplemented
@meta.ctor("EveChildModifierSRT")
export class EveChildModifierSRT extends EveChildModifier
{

    @meta.quaternion
    rotation = quat.create();

    @meta.vector3
    scaling = vec3.fromValues(1, 1, 1);

    @meta.vector3
    translation = vec3.create();

}
