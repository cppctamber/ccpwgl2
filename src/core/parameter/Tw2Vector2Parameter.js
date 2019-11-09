import { vec2 } from "global";
import { Tw2VectorParameter } from "./Tw2VectorParameter";

/**
 * Tw2Vector2Parameter
 * TODO: Is this deprecated?
 * @ccp N/A
 */
export class Tw2Vector2Parameter extends Tw2VectorParameter
{

    /**
     * Constructor
     * @param {String} [name='']
     * @param {vec2|Array|Float32Array} [value=vec2.fromValues(1,1)]
     */
    constructor(name = "", value = vec2.fromValues(1, 1))
    {
        super(name, value);
    }

    /**
     * Gets the first value index
     * @returns {Number}
     */
    get x()
    {
        return this.GetIndexValue(0);
    }

    /**
     * Sets the first value index
     * @param {Number} val
     */
    set x(val)
    {
        this.SetIndexValue(0, val);
    }

    /**
     * Gets the second value index
     * @returns {Number}
     */
    get y()
    {
        return this.GetIndexValue(1);
    }

    /**
     * Sets the second value index
     * @param {Number} val
     */
    set y(val)
    {
        this.SetIndexValue(1, val);
    }

    /**
     * The parameter's constant buffer size
     * @type {Number}
     */
    static constantBufferSize = 2;

}
