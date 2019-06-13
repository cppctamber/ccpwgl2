import {ErrAbstractClassMethod} from "../../core/Tw2Error";
import {isArray, isFunction, isObjectObject, isPlain, isPrimary, isTyped} from "../util";
import {Tw2EventEmitter} from "./Tw2EventEmitter";

/**
 * Base class
 * @param {Tw2Library} [tw2]
 */
export function Tw2BaseClass(tw2)
{
    Tw2BaseClass.defineID(this);
}

Tw2BaseClass.prototype = Object.assign(Object.create(Tw2EventEmitter.prototype), {

    constructor: Tw2BaseClass,

    /**
     * Copies another object's values
     * @param {*} a
     * @param {*} [opt]
     * @returns {*}
     */
    Copy(a, opt)
    {
        return this.constructor.copy(this, a, opt);
    },

    /**
     * Clones the object
     * @param [opt]
     * @returns {*}
     */
    Clone(opt)
    {
        this.constructor.clone(this, opt);
    },

    /**
     * Sets the object's values from a plain object
     * @param [values]
     * @param [opt]
     * @returns {Boolean}
     */
    Set(values, opt)
    {
        return this.constructor.set(this, values, opt);
    },

    /**
     * Gets the object's values as a plain object
     * @param [out]
     * @param [opt]
     * @returns {*}
     */
    Get(out, opt)
    {
        return this.constructor.get(this, out, opt);
    },

    /**
     * Internal handler for value changes
     * @param [opt]
     */
    OnValueChanged(opt)
    {

    },

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
    },

    /**
     * Internal handler for object destruction
     * @param [opt]
     */
    OnDestroy(opt)
    {

    },

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
    },

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

});

let OBJECT_ID = 0;

/**
 * Defines an id
 * @param {*} target
 */
Tw2BaseClass.defineID = function(target)
{
    Reflect.defineProperty(target, "_id", {
        value: OBJECT_ID++,
        writable: false,
        configurable: true
    });
};

/**
 * Creates an object from values
 * @param [values]
 * @param [opt={}]
 * @returns {*}
 */
Tw2BaseClass.from = function (values, opt)
{
    if (values && values instanceof this) return values;
    const item = new this();
    if (values)  this.set(item, values, {skipUpdate: true});
    if (!opt || !opt.skipUpdate) if ("Initialize" in item) item.Initialize();
    return item;
};

/**
 * Internal handler for copying one object's values to another
 * @param {*} a
 * @param {*} b
 * @param {*} [opt]
 * @private
 */
Tw2BaseClass.copy = function (a, b, opt = {})
{
    const {skipUpdate} = opt;
    return this.set(a, this.get(b, {}, {skipIds: true}), {skipUpdate, verb: "copy"});
};

/**
 * Internal handler for cloning an object
 * @param {*} a
 * @param {*} [opt]
 * @private
 */
Tw2BaseClass.clone = function (a, opt)
{
    return this.from(this.get(a, {}, {skipIds: true}), opt);
};

/**
 * Internal handler for setting an object's values from a plain object
 * @param {*} a
 * @param {*} [values]
 * @param {*} [opt]
 * @returns {boolean}
 * @private
 */
Tw2BaseClass.set = function (a, values, opt = {})
{
    throw new ErrAbstractClassMethod();
};

/**
 * Internal handler for getting an object's value as a plain object
 * @param {*} a
 * @param {*} [out={}]
 * @param {*} [opt]
 * @returns {*} out
 * @private
 */
Tw2BaseClass.get = function (a, out = {}, opt = {})
{
    throw new ErrAbstractClassMethod();
};

/**
 *
 * @type {*}
 * @private
 */
Tw2BaseClass.keys = null;

/**
 *
 * @type {*}
 */
Tw2BaseClass.black = null;

/**
 *
 * @type {null|String}
 */
Tw2BaseClass.category = null;

/**
 * Caches the classes keys
 * -- Fallback if schema not present
 * @param {*} obj
 */
function cacheKeys(obj)
{
    const cache = obj.constructor.keys || {};

    function add(name, key)
    {
        if (!cache[name]) cache[name] = [];
        if (!cache[name].includes(key)) cache[name].push(key);
    }

    for (const key in obj)
    {
        if (obj.hasOwnProperty(key) && key.charAt(0) !== "_")
        {
            const value = obj[key];
            if (isPrimary(value)) add("primary", key);
            else if (isArray(value)) add("array", key);
            else if (isTyped(value)) add("typed", key);
            else if (value === null || isObjectObject(value)) add("object", key);
            else if (isPlain(value)) add("plain", key);
        }
    }

    obj.constructor.keys = cache;
}

/**
 * Fires a callback on an object's children, and no further
 * @param {*} obj
 * @param {Function} callback
 * @param {String} [path="root"]
 * @returns {!*}
 */
Tw2BaseClass.perChild = function (obj, callback, path="root")
{
    if (!obj.constructor.keys) cacheKeys(obj);

    const {array, object} = obj.constructor.keys;

    if (array)
    {
        for (let i = 0; i < array.length; i++)
        {
            const
                key = array[i],
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

    if (object)
    {
        for (let i = 0; i < object.length; i++)
        {
            const
                key = object[i],
                item = obj[key];

            if (isObjectObject(item))
            {
                let currentPath = `${path}/${key}`;
                const result = callback(item, obj, currentPath);
                if (result) return result;
            }
        }
    }
};


