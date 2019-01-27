import {vec3, quat, mat4} from "../../global";
import {Tw2Parameter} from "./Tw2Parameter";

/**
 * Tw2TransformParameter
 * TODO: Original ccp class looks to only have rotation, reference "/probecursor.black"
 * TODO: If rotationCenter isn't required remove it (I don't recall seeing it used anywhere and not used in new files)
 * @ccp TriTransformParameter
 *
 * @parameter {vec3} scaling=[1,1,1]
 * @parameter {quat} rotation=[0,0,0,1]
 * @parameter {vec3} translation=[0,0,0]
 * @parameter {mat4} transform
 * @parameter {mat4} _transformTranspose
 * @parameter {Float32Array} _constantBuffer
 * @parameter {Number} _offset
 */
export class Tw2TransformParameter extends Tw2Parameter
{
    // ccp
    rotation = quat.create();

    // ccpwgl
    scaling = vec3.fromValues(1, 1, 1);
    rotationCenter = vec3.create();
    translation = vec3.create();
    transform = mat4.create();

    _transformTranspose = mat4.create();
    _constantBuffer = null;
    _offset = null;


    /**
     * Initializes the transform parameter
     */
    Initialize()
    {
        this.UpdateValues();
    }

    /**
     * Gets the parameter's value
     * @param {Boolean} [serialize]
     * @returns {Array|Float32Array|mat4}
     */
    GetValue(serialize)
    {
        return serialize ? Array.from(this.transform) : new Float32Array(this.transform);
    }

    /**
     * Fire on value changes
     * @param {*} [controller]       - An optional argument to track the object that called this function
     * @param {Boolean} [skipUpdate] -
     */
    OnValueChanged(controller, skipUpdate)
    {
        mat4.fromRotationTranslationScaleOrigin(this.transform, this.rotation, this.translation, this.scaling, this.rotationCenter);
        mat4.transpose(this._transformTranspose, this.transform);
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
            constantBuffer.set(this._transformTranspose, offset);
        }
        else
        {
            constantBuffer.set(this._transformTranspose.subarray(0, size), offset);
        }
    }

    /**
     * The parameter's constant buffer size
     * @type {Number}
     */
    static constantBufferSize = 16;

}
