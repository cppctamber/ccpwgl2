import { meta, vec4, quat } from "global";
import { Tw2VectorParameter } from "./Tw2VectorParameter";


/**
 * Tw2Vector2Parameter
 *
 * @property {String} name
 * @property {vec4|quat} value
 */
@meta.type("Tw2Vector4Parameter", "TriVector4Parameter")
export class Tw2Vector4Parameter extends Tw2VectorParameter
{

    @meta.black.string
    name = "";

    @meta.black.vector4
    value = vec4.fromValues(1,1,1,1);


    /**
     * Constructor
     * @param {String} [name]
     * @param {vec4|Array|Float32Array} [value]
     */
    constructor(name, value)
    {
        super();
        if (name) this.name = name;
        if (value) vec4.copy(this.value, value);
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

}
