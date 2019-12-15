import { quat, vec3, Tw2BaseClass, meta } from "global";


/**
 * EveChildModifierSRT
 *
 * @property {quat} rotation    -
 * @property {vec3} scaling     -
 * @property {vec3} translation -
 */
@meta.notImplemented
@meta.type("EveChildModifierSRT", true)
export class EveChildModifierSRT extends Tw2BaseClass
{

    @meta.black.quaternion
    rotation = quat.create();

    @meta.black.vector3
    scaling = vec3.fromValues(1, 1, 1);

    @meta.black.vector3
    translation = vec3.create();

}
