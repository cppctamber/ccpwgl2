import {ErrIndexBounds} from "../Tw2Error";
import {util, Tw2BaseClass} from "../../global";

/**
 * Tw2VectorParameter base class
 * TODO: Remove constructor parameters
 * @ccp N/A
 *
 * @property {Float32Array} value
 * @property {?Float32Array} _constantBuffer
 * @property {?Number} _offset
 */
export class Tw2VectorParameter extends Tw2BaseClass
{

    value = new Float32Array(this.size);
    _constantBuffer = null;
    _offset = null;


    /**
     * Gets the parameter's constant buffer size
     * @returns {Number} 0 if invalid
     */
    get size()
    {
        return this.constructor.constantBufferSize;
    }

    /**
     * Constructor
     * @param {String} [name='']
     * @param {Float32Array|Array} [value]
     */
    constructor(name, value)
    {
        super();
        this.name = name;
        if (value) this.value.set(value);
    }

    /**
     * Sets the parameter's value
     * @param {Float32Array} value   - The value to set
     * @param {*} [controller]       - The object that is setting the value
     * @param {Boolean} [skipUpdate] - Skips updating
     */
    SetValue(value, controller, skipUpdate)
    {
        //if (!this.EqualsValue(value))
        //{
        this.value.set(value);
        this.UpdateValues(controller, skipUpdate);
        //return true;
        //}
        //return false;
    }

    /**
     * Sets a parameter's value at a given index
     * @param {Number} index         - the parameter's value index to change
     * @param {Number} value         - the value to set
     * @param {*} [controller]       - the object that is setting the value
     * @param {Boolean} [skipUpdate] -
     * @throw Index Error
     */
    SetIndexValue(index, value, controller, skipUpdate)
    {
        if (this.value[index] !== undefined)
        {
            if (this.value[index] !== value)
            {
                this.value[index] = value;
                this.UpdateValues();
            }
            return;
        }
        throw new ErrIndexBounds();
    }

    /**
     * Gets the parameter's value
     * @param {Boolean} [serialize] - An optional parameter to force a serialized result
     * @returns {Array|Float32Array}
     */
    GetValue(serialize)
    {
        const value = this._constantBuffer ? this._constantBuffer.subarray(this._offset, this._offset + this.size) : this.value;
        return serialize ? Array.from(value) : new Float32Array(value);
    }

    /**
     * Gets a parameter's value at a given index
     * @param index
     * @returns {Number}
     * @throw Index Error
     */
    GetIndexValue(index)
    {
        if (this.value[index] !== undefined)
        {
            return this.value[index];
        }
        throw new ErrIndexBounds();
    }

    /**
     * Fires on value changes
     * @param {*} [controller]- An optional parameter for tracking the object that called the function
     * @param {Boolean} [skipUpdate] - An optional parameter to skip updates
     */
    OnValueChanged(controller, skipUpdate)
    {
        if (this._constantBuffer)
        {
            this.Apply(this._constantBuffer, this._offset);
        }
    }

    /**
     * Binds the parameter to a constant buffer
     * @param {Float32Array} constantBuffer
     * @param {Number} offset
     * @param {Number} size
     * @returns {Boolean} true if bound
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
     * Unbinds the parameter from a constant buffer
     */
    Unbind()
    {
        this._constantBuffer = null;
    }

    /**
     * Applies the parameter's value to it's constant buffer
     * @param {Float32Array} constantBuffer
     * @param {Number} offset
     * @param {Number} [size]
     */
    Apply(constantBuffer, offset, size)
    {
        constantBuffer.set(this.value, offset);
    }

    /**
     * Checks if a value equals the parameter's value
     * - Assumes the correct length array or typed array is passed
     * @param {Array|Float32Array} value
     * @returns {Boolean}
     */
    EqualsValue(value)
    {
        for (let i = 0; i < this.size; i++)
        {
            if (this.value[i] !== value[i])
            {
                return false;
            }
        }
        return true;
    }

    /**
     * Checks if a value is a valid parameter input
     * @param {Float32Array|Array} value
     * @returns {Boolean}
     */
    static isValue(value)
    {
        return (util.isArrayLike(value) && value.length === this.constantBufferSize);
    }

    /**
     * The parameter's constant buffer size
     * @type {Number}
     */
    static constantBufferSize = 0;

}

Tw2BaseClass.define(Tw2VectorParameter, Type =>
{
    return {
        type: "Tw2VectorParameter",
        category: "Parameter",
        isAbstract: true,
        isLeaf: true
    };
});
