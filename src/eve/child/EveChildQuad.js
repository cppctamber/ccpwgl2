import { meta, mat4, quat, vec3, vec4 } from "global";
import { EveChild } from "./EveChild";


/**
 * EveChildQuad
 *
 * @property {String} name              -
 * @property {Number} brightness        -
 * @property {vec4} color               -
 * @property {Tw2Effect} effect         -
 * @property {mat4} localTransform      -
 * @property {Number} minScreenSize     -
 * @property {quat} rotation            -
 * @property {vec3} scaling             -
 * @property {vec3} translation         -
 */
@meta.notImplemented
@meta.type("EveChildQuad", true)
export class EveChildQuad extends EveChild
{

    @meta.black.string
    name = "";

    @meta.black.float
    brightness = 0;

    @meta.black.color
    color = vec4.create();

    @meta.black.object
    effect = null;

    @meta.black.matrix4
    localTransform = mat4.create();

    @meta.black.float
    minScreenSize = 0;

    @meta.black.quaternion
    rotation = quat.create();

    @meta.black.vector3
    scaling = vec3.fromValues(1, 1, 1);

    @meta.black.vector3
    translation = vec3.create();

    /**
     * Gets object resources
     * @param {Array} [out=[]] - Optional receiving array
     * @returns {Array.<Tw2Resource>} [out]
     */
    GetResources(out = [])
    {
        if (this.effect) this.effect.GetResources(out);
        return out;
    }

}
