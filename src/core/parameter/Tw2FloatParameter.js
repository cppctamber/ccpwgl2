import { Tw2Parameter } from "./Tw2Parameter";
import { meta, isArrayLike, isNumber } from "utils";


@meta.type("Tw2FloatParameter", "Tr2FloatParameter")
export class Tw2FloatParameter extends Tw2Parameter
{

    @meta.string
    name = "";

    @meta.float
    value = 1;

    /**
     * Alias for value
     * @return {Number}
     */
    get x()
    {
        return this.value;
    }

    /**
     * Alias for set value
     * @param {Number} val
     */
    set x(val)
    {
        this.SetValue(val);
    }


    /**
     * Constructor
     * @param {String} [name]
     * @param {Number} [value]
     */
    constructor(name = "", value)
    {
        super();
        if (name) this.name = name;
        if (value !== undefined) this.value = isArrayLike(value) ? value[0] : value;
    }

    /**
     * Sets the parameter's value
     * @param {Number} value
     * @param {*} [opt]
     * @returns {Boolean}
     */
    SetValue(value, opt)
    {
        if (!this.EqualsValue(value))
        {
            this.value = value;
            this.UpdateValues(opt);
            return true;
        }
        return false;
    }

    /**
     * Gets the parameter's value
     * @returns {Number}
     */
    GetValue()
    {
        return this.value;
    }

    /**
     * Applies the parameter's value to a constant buffer
     * @param {Float32Array} constantBuffer
     * @param {Number} offset
     * @param {*} unused
     */
    Apply(constantBuffer, offset, unused)
    {
        constantBuffer[offset] = this.value;
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
     * @param constantBuffer
     * @param offset
     * @param size
     * @returns {Boolean} true if bound
     */
    Bind(constantBuffer, offset, size)
    {
        if (!this._constantBuffer)
        {
            this._constantBuffer = constantBuffer;
            this._offset = offset;
            this.Apply(constantBuffer, offset);
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
     * Checks if a value equals the parameter's value
     * @param {Number} value
     * @returns {Boolean}
     */
    EqualsValue(value)
    {
        return this.value === value;
    }

    /**
     * Checks if a value is a valid parameter value
     * @param {Number} a
     * @returns {Boolean}
     */
    static isValue(a)
    {
        return isNumber(a);
    }

    /**
     * The parameter's constant buffer size
     * @type {Number}
     */
    static constantBufferSize = 1;

}
