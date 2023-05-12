import { meta } from "utils";
import { quat, vec3, mat4 } from "math";


@meta.type("EveSOFDataPatternTransform")
export class EveSOFDataPatternTransform extends meta.Model
{

    @meta.boolean
    isMirrored = false;

    @meta.vector3
    position = vec3.create();

    @meta.quaternion
    rotation = quat.create();

    @meta.vector3
    scaling = vec3.fromValues(1, 1, 1);

    /**
     * Empties the transform layer
     */
    Empty()
    {
        vec3.copy(this.position, [ 0, 0, 0 ]);
        vec3.copy(this.scaling, [ 0, 0, 0 ]);
        quat.copy(this.rotation, [ 0, 0, 0, 1 ]);
        this.isMirrored = false;
    }

    /**
     * Sets the transform from a custom mask
     * @param {EveCustomMask} [customMask]
     */
    SetFromCustomMask(customMask)
    {
        if (!customMask)
        {
            this.Empty();
            return;
        }

        vec3.copy(this.position, customMask.translation);
        vec3.copy(this.scaling, customMask.scaling);
        quat.copy(this.rotation, customMask.rotation);
        this.isMirrored = customMask.isMirrored;
    }

    /**
     * Gets a transform from the object
     * @param {mat4} out
     * @returns {mat4}
     */
    GetTransform(out)
    {
        return mat4.fromRotationTranslationScale(out, this.rotation, this.position, this.scaling);
    }

}
