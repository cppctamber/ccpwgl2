import { vec4 } from "../../global";
import { Tw2VectorParameter } from "./Tw2VectorParameter";

/**
 * Tw2Vector4Parameter
 *
 * @class
 */
export class Tw2Vector4Parameter extends Tw2VectorParameter
{

    /**
     * Constructor
     * @param {String} [name='']
     * @param {vec4|Array|Float32Array} [value=vec4.fromValues(1,1,1,1)]
     */
    constructor(name = "", value = vec4.fromValues(1, 1, 1, 1))
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
     * Gets the third value index
     * @returns {Number}
     */
    get z()
    {
        return this.GetIndexValue(2);
    }

    /**
     * Sets the third value index
     * @param {Number} val
     */
    set z(val)
    {
        this.SetIndexValue(2, val);
    }

    /**
     * Gets the fourth value index
     * @returns {Number}
     */
    get w()
    {
        return this.GetIndexValue(3);
    }

    /**
     * Sets the fourth value index
     * @param {Number} val
     */
    set w(val)
    {
        this.SetIndexValue(3, val);
    }

    /**
     * The parameter's constant buffer size
     * @type {Number}
     */
    static constantBufferSize = 4;

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            [ "name", r.string ],
            [ "value", r.vector4 ]
        ];
    }

}
