import { meta } from "utils";
import { vec3, quat, mat4 } from "math";
import { Tw2Parameter } from "./Tw2Parameter";


@meta.type("Tw2TransformParameter", "Tr2TransformParameter")
export class Tw2TransformParameter extends Tw2Parameter
{

    @meta.vector3
    scaling = vec3.fromValues(1, 1, 1);

    @meta.vector3
    rotationCenter = vec3.create();

    @meta.quaternion
    rotation = quat.create();

    @meta.vector3
    translation = vec3.create();

    @meta.matrix4
    transform = mat4.create();

    @meta.matrix4
    worldTransform = mat4.create();

    /**
     * Initializes the transform parameter
     */
    Initialize()
    {
        this.UpdateValues();
    }

    /**
     * Sets the parameter's value
     * @param {mat4} value
     * @param {Object} [opt]
     */
    SetValue(value, opt)
    {
        mat4.getRotation(this.rotation, value);
        mat4.getTranslation(this.translation, value);
        mat4.getScaling(this.scaling, value);
        this.UpdateValues(opt);
    }

    /**
     * Gets the parameter's value
     * @returns {Array|mat4}
     */
    GetValue(out)
    {
        return mat4.copy(out, this.worldTransform);
    }

    /**
     * Fire on value changes
     */
    OnValueChanged()
    {
        mat4.fromRotationTranslationScaleOrigin(this.transform, this.rotation, this.translation, this.scaling, this.rotationCenter);
        mat4.transpose(this.worldTransform, this.transform);
    }

    /**
     * Binds the parameter to a constant buffer
     * @param {Float32Array} constantBuffer
     * @param {Number} offset
     * @param {Number} size
     * @returns {Boolean}
     */
    Bind(constantBuffer, offset, size)
    {
        if (!this._constantBuffer && size >= this.size)
        {
            this._constantBuffer = constantBuffer;
            this._offset = offset;
            this.Apply(constantBuffer, offset, size);
            return true;
        }
        return false;
    }

    /**
     * Applies the parameter's value to a constant buffer
     * @param {Float32Array} constantBuffer
     * @param {Number} offset
     * @param {Number} size
     */
    Apply(constantBuffer, offset, size)
    {
        if (size >= this.constructor.constantBufferSize)
        {
            constantBuffer.set(this.worldTransform, offset);
        }
        else
        {
            constantBuffer.set(this.worldTransform.subarray(0, size), offset);
        }
    }

    /**
     * The parameter's constant buffer size
     * @type {Number}
     */
    static constantBufferSize = 16;

}
