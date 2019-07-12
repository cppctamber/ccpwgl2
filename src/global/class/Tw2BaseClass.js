import {ErrAbstractClassMethod} from "../../core/Tw2Error";
import {generateID, isArray, isFunction, isObjectObject, isPlain, isPrimary, isTyped} from "../util";
import {Tw2EventEmitter} from "./Tw2EventEmitter";


/**
 * Tw2BaseClass
 * @namespace Tw2EventEmitter
 */
export class Tw2BaseClass
{

    constructor()
    {
        Reflect.defineProperty(this, "_id", {
            value: generateID(),
            writable: false,
            configurable: true
        });
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
        this.constructor.clone(this, opt);
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
            this.emit("modified", opt);
        }
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
            this.emit("destroy", opt);
        }

        this.kill();
    }

    /**
     * Traverses the object
     * @param {Function} callback
     * @param {*} [parent]
     * @param {String} [path]
     * @returns {*}
     */
    Traverse(callback, parent, path)
    {
        const result = callback(this, parent, path);
        if (result) return result;

        function onChild(child, parent, path)
        {
            if (isFunction(child.Traverse))
            {
                const result = child.Traverse(callback, parent, path);
                if (result) return result;
            }
        }

        return this.constructor.perChild(this, onChild, path);
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
        const values = this.get(b, {}, {skipIDs: true});
        return this.set(a, values, opt);
    }

    /**
     * Internal handler for cloning an object
     * @param {*} a
     * @param {*} [opt]
     * @private
     */
    static clone(a, opt)
    {
        const values = this.get(a, {}, {skipIDs: true});
        return this.from(values, opt);
    }

    /**
     * Creates an object from values
     * @param [values]
     * @param [opt={}]
     * @returns {*}
     */
    static from(values, opt)
    {
        if (values && values instanceof this)
        {
            return values;
        }

        const item = new this();
        if (values)
        {
            this.set(item, values, {skipUpdate: true, verb: "create"});
        }

        if ((!opt || !opt.skipUpdate) && "Initialize" in item)
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
     * Fires a callback on an object's child lists and types, and no further
     * @param {*} obj
     * @param {Function} callback
     * @param {String} [path="root"]
     * @returns {!*}
     */
    static perChild(obj, callback, path = "root")
    {
        if (!obj.constructor.keys)
        {
            cacheKeys(obj);
        }

        const {list, type} = obj.constructor.keys;

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
     *
     * @type {*}
     * @private
     */
    static keys = null;

    /**
     *
     * @type {*}
     */
    static black = null;

    /**
     *
     * @type {null|String}
     */
    static category = null;

}

/**
 * Caches the classes keys
 * -- Fallback if schema not present
 * @param {*} obj
 */
function cacheKeys(obj)
{
    if (obj.constructor.hasOwnProperty("keys"))
    {
        return;
    }

    const cache = {};

    function add(name, key)
    {
        if (!cache[name])
        {
            cache[name] = [];
        }

        if (!cache[name].includes(key))
        {
            cache[name].push(key);
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

    obj.constructor.keys = cache;
}

Object.assign(Object.getPrototypeOf(Tw2BaseClass), Object.getPrototypeOf(Tw2EventEmitter));