import { meta, vec3 } from "global";
import { Tw2VectorParameter } from "./Tw2VectorParameter";


@meta.ctor("Tw2Vector3Parameter")
export class Tw2Vector3Parameter extends Tw2VectorParameter
{

    @meta.string
    name = "";

    @meta.vector3
    value = vec3.fromValues(1, 1, 1);


    /**
     * Constructor
     * @param {String} [name]
     * @param {vec3|Array|Float32Array} [value]
     */
    constructor(name, value)
    {
        super();
        if (name) this.name = name;
        if (value) vec3.copy(this.value, value);
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
     * The parameter's constant buffer size
     * @type {Number}
     */
    static constantBufferSize = 3;

}
