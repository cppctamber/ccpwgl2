import { ErrIndexBounds } from "../Tw2Error";
import { meta, isArrayLike } from "utils";


@meta.define("Tw2VectorParameter")
export class Tw2VectorParameter extends meta.Model
{

    /**
     * The slot width this parameter was bound at, in floats. Equals `size`
     * unless the shader declared a narrower constant - see {@link Bind}.
     * @type {Number}
     */
    _boundSize = 0;

    /**
     * Gets the parameter's constant buffer size
     * @returns {Number} 0 if invalid
     */
    get size()
    {
        return this.constructor.constantBufferSize;
    }

    /**
     * Sets the parameter's value
     * @param {Float32Array} value   - The value to set
     * @param {*} [opt]
     * @returns {Boolean}
     */
    SetValue(value, opt)
    {
        if (!this.EqualsValue(value))
        {
            this.value.set(value);
            this.UpdateValues(opt);
            return true;
        }
        return false;
    }

    /**
     * Sets a parameter's value at a given index
     * @param {Number} index         - the parameter's value index to change
     * @param {Number} value         - the value to set
     * @param {*} [opt]              - the object that is setting the value
     * @throw Index Error
     */
    SetIndexValue(index, value, opt)
    {
        if (this.value[index] !== undefined)
        {
            if (this.value[index] !== value)
            {
                this.value[index] = value;
                this.UpdateValues(opt);
            }
            return;
        }
        throw new ErrIndexBounds();
    }

    /**
     * Gets the parameter's value
     * @param {TypedArray|Array} [out=[]]
     * @returns {Array|Float32Array}
     */
    GetValue(out = [])
    {
        const width = this._boundSize || this.size;
        const value = this._constantBuffer ? this._constantBuffer.subarray(this._offset, this._offset + width) : this.value;
        for (let i = 0; i < value.length; i++) out[i] = value[i];
        return out;
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
     */
    OnValueChanged()
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
        if (this._constantBuffer) return false;

        // A NARROWER slot is legitimate, and refusing it silently loses the
        // value. Carbon's wire struct has no type:
        //
        //     struct Tr2ConstantEffectParameter
        //     { BlueSharedString name; Vector4 value; };   Tr2Effect.h:41-45
        //
        // Every const parameter is stored as a Vector4 even when the shader
        // declares one float, so `earthlikeplanet`'s `Random` arrives here as a
        // 4-float parameter for a slot the shader declares as 1 float
        // (`size: 4` bytes, `dimension: 1`). Under the old `size >= this.size`
        // test that bind failed, returned false, told nobody, and left the
        // constant at zero.
        //
        // The shader's declared size is the authority - it is the only place
        // the dimension exists - so the leading components are packed and the
        // rest dropped. A float slot takes value[0], which is where Carbon puts
        // a scalar.
        if (size >= this.size || size > 0)
        {
            this._constantBuffer = constantBuffer;
            this._offset = offset;
            // Remembered because OnValueChanged re-applies without a size, and
            // writing the full width then would run past the slot into whatever
            // constant follows it.
            this._boundSize = Math.min(size, this.size);
            this.Apply(constantBuffer, offset, this._boundSize);
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
        this._boundSize = 0;
    }

    /**
     * Applies the parameter's value to it's constant buffer
     * @param {Float32Array} constantBuffer
     * @param {Number} offset
     * @param {Number} [size]
     */
    Apply(constantBuffer, offset, size)
    {
        // `size` is the slot's width in floats. It is absent when
        // OnValueChanged re-applies, which is why the bound width is kept.
        const width = Math.min(size === undefined ? this._boundSize : size, this.size);

        if (width >= this.size)
        {
            constantBuffer.set(this.value, offset);
            return;
        }

        // Leading components only - see Bind. Written element by element
        // because `value` is not always a typed array, so `subarray` cannot be
        // assumed; at four components at most this costs nothing.
        for (let i = 0; i < width; i++) constantBuffer[offset + i] = this.value[i];
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
        return (isArrayLike(value) && value.length === this.constantBufferSize);
    }

    /**
     * The parameter's constant buffer size
     * @type {Number}
     */
    static constantBufferSize = 0;

}
