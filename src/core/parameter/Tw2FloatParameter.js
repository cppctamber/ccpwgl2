import { Tw2Parameter } from "./Tw2Parameter";
import { meta, util } from "global";


@meta.ctor("Tw2FloatParameter", "Tr2FloatParameter")
export class Tw2FloatParameter extends Tw2Parameter
{

    @meta.string
    name = "";

    @meta.float
    value = 1;


    /**
     * Constructor
     * @param {String} [name='']
     * @param {Number} [value=1]
     */
    constructor(name = "", value = 1)
    {
        super();

        if (name) this.name = name;

        if (value !== undefined)
        {
            this.value = util.isArrayLike(value) ? value[0] : value;
        }
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
     */
    Apply(constantBuffer, offset)
    {
        constantBuffer[offset] = this.value;
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
        return util.isNumber(a);
    }

    /**
     * The parameter's constant buffer size
     * @type {Number}
     */
    static constantBufferSize = 1;

}
