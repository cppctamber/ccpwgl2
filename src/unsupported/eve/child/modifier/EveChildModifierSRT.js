import { meta } from "utils";
import { vec3, quat, mat4 } from "math";
import { EveChildModifier } from "./EveChildModifier";


@meta.notImplemented
@meta.type("EveChildModifierSRT")
export class EveChildModifierSRT extends EveChildModifier
{

    @meta.quaternion
    rotation = quat.create();

    @meta.vector3
    scaling = vec3.fromValues(1, 1, 1);

    @meta.vector3
    translation = vec3.create();

    /**
     * Modifies a parent object
     * @param parent
     * @param perObjectData
     */
    Modify(parent, perObjectData)
    {
        mat4.fromRotationTranslationScale(parent.localTransform, this.rotation, this.translation, this.scaling);
    }

}
