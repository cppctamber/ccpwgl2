import { meta, quat, vec3, mat4, Tw2BaseClass } from "global";

/**
 * EveBanner
 *
 * @property {Number} angleX    -
 * @property {Number} angleY    -
 * @property {Number} boneIndex -
 * @property {vec3} position    -
 * @property {quat} rotation    -
 * @property {vec3} scaling     -
 * @property {Number} usage     -
 */
@meta.type("EveBanner", true)
@meta.notImplemented
export class EveBanner extends Tw2BaseClass
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
