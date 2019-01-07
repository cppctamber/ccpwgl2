import {Tw2Parameter} from "./Tw2Parameter";
import {util} from "../../global";

/**
 * Tw2FloatParameter
 *
 * @property {String} name
 * @property {Number} value
 * @property {?Float32Array} constantBuffer
 * @property {?Number} offset
 * @class
 */
export class Tw2FloatParameter extends Tw2Parameter
{

    name = "";
    value = 1;
    constantBuffer = null;
    offset = null;


    /**
     * Constructor
     * @param {String} [name='']
     * @param {Number} [value=1]
     */
    constructor(name = "", value = 1)
    {
        super(name);
        this.value = util.isArrayLike(value) ? value[0] : value;
    }

    /**
     * Sets the parameter's value
     * @param {Number} value
     * @returns {Boolean} true if updated
     */
    SetValue(value)
    {
        this.value = value;
        this.OnValueChanged();
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
     * Checks if a value equals the parameter's value
     * @param {Number} value
     * @returns {Boolean}
     */
    EqualsValue(value)
    {
        return this.value === value;
    }

    /**
     * Copies another float parameter's value
     * @param {Tw2FloatParameter} parameter
     * @param {Boolean} [includeName]
     */
    Copy(parameter, includeName)
    {
        if (includeName) this.name = parameter.name;
        this.SetValue(parameter.GetValue());
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
