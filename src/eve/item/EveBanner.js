import {quat, vec3, mat4, Tw2BaseClass} from "../../global";

/**
 * EveBanner
 * TODO: Implement
 * @ccp EveBanner
 *
 * @property {Number} angleX    -
 * @property {Number} angleY    -
 * @property {Number} boneIndex -
 * @property {vec3} position    -
 * @property {quat} rotation    -
 * @property {vec3} scaling     -
 * @property {Number} usage     -
 */
export class EveBanner extends Tw2BaseClass
{

    // ccp
    angleX = 0;
    angleY = 0;
    boneIndex = 0;
    position = vec3.create();
    rotation = quat.create();
    scaling = vec3.fromValues(1, 1, 1);
    usage = 0;

    //ccpwgl
    display = true;
    transform = mat4.create();

    /**
     * Fires on value changes
     */
    OnValueChanged()
    {
        mat4.fromRotationTranslationScale(this.transform, this.rotation, this.position, this.scaling);
    }

}