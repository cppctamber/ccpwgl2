import { meta } from "utils";
import { mat4, quat, vec3, vec4 } from "math";
import { EveChild } from "eve/child";


@meta.notImplemented
@meta.type("EveChildQuad")
export class EveChildQuad extends EveChild
{

    @meta.string
    name = "";

    @meta.float
    brightness = 0;

    @meta.color
    color = vec4.create();

    @meta.struct()
    effect = null;

    @meta.matrix4
    localTransform = mat4.create();

    @meta.float
    minScreenSize = 0;

    @meta.quaternion
    rotation = quat.create();

    @meta.vector3
    scaling = vec3.fromValues(1, 1, 1);

    @meta.vector3
    translation = vec3.create();

    @meta.float32Array
    viewRotation = null;

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
