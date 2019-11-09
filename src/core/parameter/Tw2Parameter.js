/* eslint no-unused-vars:0 */
import { meta, Tw2BaseClass } from "global";

/**
 * Tw2Parameter base class
 * * TODO: Remove constructor parameters
 * @ccp N/A
 */
@meta.abstract
export class Tw2Parameter extends Tw2BaseClass
{

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
     */
    constructor(name = "")
    {
        super();
        this.name = name;
    }

    /**
     * Gets the parameter's value
     * @returns {*}
     */
    @meta.abstract
    GetValue()
    {

    }

    /**
     * Binds the parameter
     * @param {*} a
     * @param {*} b
     * @param {*} c
     * @returns {Boolean} false if not bound
     */
    @meta.abstract
    Bind(a, b, c)
    {

    }

    /**
     * Unbinds the parameter
     */
    @meta.abstract
    Unbind()
    {

    }

    /**
     * Applies the parameter to a constant buffer
     * @param {*} a
     * @param {*} b
     * @param {*} c
     */
    @meta.abstract
    Apply(a, b, c)
    {

    }

    /**
     * The parameter's constant buffer size
     * @type {Number}
     */
    static constantBufferSize = 0;

}
