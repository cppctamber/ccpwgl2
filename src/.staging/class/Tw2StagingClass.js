import Tw2StagingSchema from "./Tw2StagingSchema";
import {generateID} from "../../global/util";
import {ErrAbstractClassMethod} from "../../core/Tw2Error";

/**
 * Tw2StagingClass
 *
 * @property {String} name
 * @property {Number|String} _id
 */
export default class Tw2StagingClass
{

    name = "";
    _id = generateID();

    /**
     * The classes' type
     * @returns {?String}
     * @private
     */
    static __type()
    {
        throw new ErrAbstractClassMethod();
    }

    /**
     * The classes' category
     * @returns {?String}
     * @private
     */
    static __category()
    {
        throw new ErrAbstractClassMethod();
    }

    /**
     * Identifies that the class is being developed and may not be functional
     * @type {Boolean}
     * @private
     */
    static __isStaging()
    {
        throw new ErrAbstractClassMethod();
    }

    /**
     * Identifies if the class has no traversable children
     * @returns {Boolean}
     * @private
     */
    static __isLeaf()
    {
        throw new ErrAbstractClassMethod();
    }

    /**
     * Defines a classes schema
     * @param Constructor
     * @param func
     */
    static define(Constructor, func)
    {
        return Tw2StagingSchema.create(Constructor, func, this !== Tw2StagingClass ? this : undefined);
    }

}