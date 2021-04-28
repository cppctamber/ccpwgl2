import { meta } from "utils";
import { quat, vec3, mat4 } from "math";


@meta.type("EveSOFDataTransform")
export class EveSOFDataTransform extends meta.Model
{

    @meta.uint
    boneIndex = -1;

    @meta.vector3
    position = vec3.create();

    @meta.quaternion
    rotation = quat.create();

    @meta.vector3
    scaling = vec3.fromValues(1, 1, 1);


    /**
     * Gets a transform from the object
     * @param {mat4} out
     * @returns {mat4}
     */
    GetTransform(out)
    {
        return mat4.fromRotationTranslationScale(out, this.rotation, this.translation, this.scaling);
    }

}
