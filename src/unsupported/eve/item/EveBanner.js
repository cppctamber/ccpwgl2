import { meta } from "utils";
import { quat, vec3, mat4 } from "math";


@meta.ctor("EveBanner")
@meta.notImplemented
export class EveBanner extends meta.Model
{

    @meta.string
    name = "";

    @meta.float
    angleX = 0;

    @meta.float
    angleY = 0;

    @meta.uint
    boneIndex = 0;

    @meta.boolean
    display = true;

    @meta.vector3
    position = vec3.create();

    @meta.quaternion
    rotation = quat.create();

    @meta.vector3
    scaling = vec3.fromValues(1, 1, 1);

    @meta.uint
    usage = 0;

    @meta.matrix4
    transform = mat4.create();

    /**
     * Fires on value changes
     */
    OnValueChanged()
    {
        mat4.fromRotationTranslationScale(this.transform, this.rotation, this.position, this.scaling);
    }

}
