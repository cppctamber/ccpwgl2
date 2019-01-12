import Tw2Schema from "./Tw2Schema";
import {generateID} from "../util/index";
import {ErrAbstractClassMethod} from "../../core/Tw2Error";

/**
 * Tw2StagingClass
 *
 * @property {String} name
 * @property {Number|String} _id
 * @property {*} _parent
 */
export default class Tw2BaseClass
{

    name = "";
    _id = generateID();
    _parent = null;

    /**
     * Constructor
     * @param {*} ctx
     */
    constructor(ctx)
    {
        const schema = Tw2Schema.get(this.constructor);
        if (schema) schema.OnInstantiation(this);
    }

    /**
     * Gets child resources
     * @param {Array<Tw2Resource>} [out=[]]
     * @returns {Array<Tw2Resource>} out
     */
    GetResources(out=[])
    {
        const con = this.constructor;
        if (!con.__isLeaf)
        {
            con.perChild(this, child =>
            {
                if (child.constructor.__isResource && !out.includes(child)) out.push(child);
                if ("GetResources" in child) child.GetResources(out);
            });
        }
        return out;
    }

    /**
     * Finds an object with a given id, searching from this object
     * @param {String} id
     * @returns {null|*}
     */
    FindID(id)
    {
        if (!id) return null;
        if (this._id === id) return this;
        return this.constructor.perChild(this, child =>
        {
            if ("FindID" in child)
            {
                const result = child.FindID(id);
                if (result) return result;
            }
            return null;
        });
    }

    /**
     * Finds an object by it's id, searching from the root object first
     * @param id
     */
    FindIDFromRoot(id)
    {
        return this._parent ? this._parent.FindIDFromRoot(id) : this.FindID(id);
    }

    /**
     * Calls a callback on each of an object's children
     * @param {*} obj
     * @param {Function} callback
     * @returns {*}
     */
    static perChild(obj, callback)
    {
        const schema = Tw2Schema.get(obj.constructor);
        if (!schema) throw new ErrAbstractClassMethod();

        const
            arrKeys = schema.keys.array,
            objKeys = schema.keys.object;

        if (arrKeys)
        {
            for (let x = 0; x < arrKeys.length; x++)
            {
                const
                    prop = arrKeys[x],
                    arr = obj[prop];

                if (arr)
                {
                    for (let i = 0; i < arr.length; i++)
                    {
                        const item = arr[i];
                        if (item)
                        {
                            const result = callback(obj, item, prop, i);
                            if (result) return result;
                        }
                    }
                }
            }
        }

        if (objKeys)
        {
            for (let x = 0; x < objKeys.length; x++)
            {
                const
                    prop = objKeys[x],
                    item = obj[prop];

                if (item)
                {
                    const result = callback(obj, item, prop);
                    if (result) return result;
                }
            }
        }

        return null;
    }

    /**
     * The classes' type
     * @returns {?String}
     * @private
     */
    static get __type()
    {
        throw new ErrAbstractClassMethod();
    }

    /**
     * The classes' category
     * @returns {?String}
     * @private
     */
    static __category = null;

    /**
     * Identifies that the object is a resource
     * @type {boolean}
     */
    static __isResource = false;

    /**
     * Identifies that the class is being developed and may not be functional
     * @type {Boolean}
     * @private
     */
    static __isStaging = false;

    /**
     * Identifies if the class has no traversable children
     * @returns {Boolean}
     * @private
     */
    static __isLeaf = false;

    /**
     * Defines a classes schema
     * @param Constructor
     * @param func
     */
    static define(Constructor, func)
    {
        return Tw2Schema.create(Constructor, func, this !== Tw2BaseClass ? this : undefined);
    }

}