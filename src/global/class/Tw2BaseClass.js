import { ErrAbstractClassMethod } from "../../core/Tw2Error";
import { generateID, isArray, isFunction, isObjectObject, isPlain, isPrimary, isTyped } from "../util";
import { Tw2EventEmitter } from "./Tw2EventEmitter";


/**
 * Tw2BaseClass
 */
export class Tw2BaseClass extends Tw2EventEmitter
{

    constructor()
    {
        super();
        Tw2BaseClass.defineID(this);
    }

    /**
     * Copies another object's values
     * @param {*} a
     * @param {*} [opt]
     * @returns {*}
     */
    Copy(a, opt)
    {
        return this.constructor.copy(this, a, opt);
    }

    /**
     * Clones the object
     * @param [opt]
     * @returns {*}
     */
    Clone(opt)
    {
        return this.constructor.clone(this, opt);
    }

    /**
     * Sets the object's values from a plain object
     * @param [values]
     * @param [opt]
     * @returns {Boolean}
     */
    Set(values, opt)
    {
        return this.constructor.set(this, values, opt);
    }

    /**
     * Gets the object's values as a plain object
     * @param [out]
     * @param [opt]
     * @returns {*}
     */
    Get(out, opt)
    {
        return this.constructor.get(this, out, opt);
    }

    /**
     * Internal handler for value changes
     * @param [opt]
     */
    OnValueChanged(opt)
    {

    }

    /**
     * Triggers update handlers
     * @param {*} [opt]
     */
    UpdateValues(opt)
    {
        this.OnValueChanged(opt);

        if (!opt || !opt["skipEvents"])
        {
            this.emit("modified", this, opt);
        }
    }

    /**
     * Adds a method which is called when "UpdateValues" is called
     * @param {Function} method
     * @param {*} [context]
     * @param {Boolean} [once]
     */
    OnModified(method, context, once)
    {
        this.on("modified", method, context, once);
    }

    /**
     * Removes a method from being called when "UpdateValues" is called
     * @param {Function} method
     */
    OffModified(method)
    {
        this.off("modified", method);
    }

    /**
     * Internal handler for object destruction
     * @param [opt]
     */
    OnDestroy(opt)
    {

    }

    /**
     * Destroys the object
     * @param {*} [opt]
     */
    Destroy(opt)
    {
        this.OnDestroy(opt);

        if (!opt || !opt["skipEvents"])
        {
            this.emit("destroy", this, opt);
        }

        this.del("*");
    }

    /**
     * Traverses the object and it's array properties which have objects as elements
     * @param {Function} callback
     * @param {*} [parent]
     * @param {String} [path]
     * @param {Set} [visited=new Set()]
     * @returns {*}
     */
    Traverse(callback, parent, path = "", visited=new Set())
    {
        if (visited.has(this)) return;
        visited.add(this);

        const result = callback(this, parent, path);
        if (result) return result;

        function onChild(child, parent, path)
        {
            let result;
            if (isFunction(child.Traverse))
            {
                result = child.Traverse(callback, parent, path, visited);
            }
            else if (!visited.has(child))
            {
                visited.add(child);
                result = callback(child, parent, path);
            }
            if (result) return result;
        }

        return perChild(this, onChild, path);
    }

    /**
     * Internal handler for copying one object's values to another
     * @param {*} a
     * @param {*} b
     * @param {*} [opt]
     * @private
     */
    static copy(a, b, opt = {})
    {
        opt.verb = "copy";
        const values = this.get(b, {}, { skipIDs: true });
        return this.set(a, values, opt);
    }

    /**
     * Internal handler for cloning an object
     * @param {*} a
     * @param {*} [opt={}]
     * @returns {*}
     * @private
     */
    static clone(a, opt = {})
    {
        const values = this.get(a, {}, { skipIDs: true });
        return this.from(values, opt);
    }

    /**
     * Creates an object from values
     * @param [values]
     * @param [opt={}]
     * @returns {*}
     * @private
     */
    static from(values, opt = {})
    {
        if (values && values instanceof this)
        {
            return values;
        }

        const item = new this();
        let hasInitialize = "Initialize" in item;

        if (values && Object.keys(values))
        {
            this.set(item, values, { skipUpdate: hasInitialize, verb: "create" });
        }

        if (hasInitialize && (!opt.skipUpdate))
        {
            item.Initialize();
        }

        return item;
    }


    /**
     * Internal handler for setting an object's values from a plain object
     * @param {*} a
     * @param {*} [values]
     * @param {*} [opt]
     * @returns {boolean}
     * @private
     */
    static set(a, values, opt = {})
    {
        throw new ErrAbstractClassMethod();
    }

    /**
     * Internal handler for getting an object's value as a plain object
     * @param {*} a
     * @param {*} [out={}]
     * @param {*} [opt]
     * @param {Boolean} [opt.skipID]
     * @param {Boolean} [opt.skipType]
     * @param {Boolean} [opt.skipVerb]
     * @returns {*} out
     * @private
     */
    static get(a, out = {}, opt = {})
    {
        throw new ErrAbstractClassMethod();
    }

    /**
     * Defines an unwritable unique id property on an object
     * @param {*} target
     */
    static defineID(target)
    {
        Reflect.defineProperty(target, "_id", {
            value: generateID(),
            writable: false,
            configurable: true
        });
    }

    /**
     *
     * @type {*}
     */
    static black = null;

    /**
     *
     * @type {null|String}
     */
    static __category = null;

    /**
     *
     * @type {*}
     * @private
     */
    static __keys = null;

}


/**
 * Fires a callback on an object's child lists and types, and no further
 * @param {*} obj
 * @param {Function} callback
 * @param {String} [path="root"]
 * @returns {!*}
 */
function perChild(obj, callback, path = "")
{
    const { list, type } = getKeys(obj);

    if (list)
    {
        for (let i = 0; i < list.length; i++)
        {
            const
                key = list[i],
                arr = obj[key];

            for (let x = 0; x < arr.length; x++)
            {
                const item = arr[x];

                if (isObjectObject(item))
                {
                    let currentPath = `${path}/${key}/${x}`;
                    const result = callback(item, obj, currentPath);
                    if (result) return result;
                }
            }
        }
    }

    if (type)
    {
        for (let i = 0; i < type.length; i++)
        {
            const
                key = type[i],
                item = obj[key];

            if (isObjectObject(item))
            {
                let currentPath = `${path}/${key}`;
                const result = callback(item, obj, currentPath);
                if (result) return result;
            }
        }
    }
}

/**
 * Temporary method for getting an object's keys
 * TODO: Replace with schemas
 * @param {*} obj
 */
function getKeys(obj)
{
    if (obj.constructor.hasOwnProperty("__keys") && obj.constructor.__keys !== null)
    {
        return obj.constructor.__keys;
    }

    const keys = obj.constructor.__keys = {};

    function add(name, key)
    {
        if (!keys[name])
        {
            keys[name] = [];
        }

        if (!keys[name].includes(key))
        {
            keys[name].push(key);
        }
    }

    for (const key in obj)
    {
        if (obj.hasOwnProperty(key))
        {
            // Don't cache privates
            if (key.charAt(0) === "_")
            {
                continue;
            }

            const value = obj[key];
            if (isPrimary(value))
            {
                add("primary", key);
            }
            else if (isArray(value))
            {
                // Assumes empty arrays are lists
                // Assumes if first element is a primary value that is all it contains
                if (value.length && isPrimary(value[0]))
                {
                    add("array", key);
                }
                else
                {
                    add("list", key);
                }
            }
            else if (isTyped(value))
            {
                add("typed", key);
            }
            else if (isPlain(value))
            {
                add("plain", key);
            }
            else if (value === null || isObjectObject(value))
            {
                add("type", key);
            }
        }
    }

    return obj.constructor.__keys;
}
