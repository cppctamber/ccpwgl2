/* eslint no-unused-vars:0 */
import {util, Tw2BaseClass} from "../../global";
import {ErrAbstractClassMethod} from "../Tw2Error";

/**
 * Tw2Parameter base class
 * * TODO: Remove constructor parameters
 * @ccp N/A
 */
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
    GetValue()
    {
        throw new ErrAbstractClassMethod();
    }

    /**
     * Binds the parameter
     * @param {*} a
     * @param {*} b
     * @param {*} c
     * @returns {Boolean} false if not bound
     */
    Bind(a, b, c)
    {
        throw new ErrAbstractClassMethod();
    }

    /**
     * Unbinds the parameter
     */
    Unbind()
    {
        throw new ErrAbstractClassMethod();
    }

    /**
     * Applies the parameter to a constant buffer
     * @param {*} a
     * @param {*} b
     * @param {*} c
     */
    Apply(a, b, c)
    {
        throw new ErrAbstractClassMethod();
    }

    /**
     * The parameter's constant buffer size
     * @type {Number}
     */
    static constantBufferSize = 0;

}
