import Tw2Schema from "./Tw2Schema";
import {ErrAbstractClassMethod} from "../../core/Tw2Error";
import {generateID, isArray, isFunction, isObjectObject, isPlain, isPrimary, isTyped} from "../util";

/**
 * Provides core functionality for classes
 *
 * @property {String} name
 * @property {Number|String} _id
 * @property {*} _parent
 */
export default class Tw2BaseClass
{

    _id = generateID();

    /* ----------------------------------------------------------------------------------------------------------------

                                                    Utilities

    -----------------------------------------------------------------------------------------------------------------*/

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
     * Creates an object from values
     * @param [values]
     * @param [opt={}]
     * @returns {*}
     */
    static from(values, opt)
    {
        // Allow setting already instantiated object
        if (values && values instanceof this)
        {
            return values;
        }

        const item = new this();

        if (values)
        {
            this.set(item, values, {skipUpdate: true});
        }

        if (!opt || !opt.skipUpdate)
        {
            if ("Initialize" in item) item.Initialize();
        }

        return item;
    }

    /**
     * Internal handler for copying one object's values to another
     * @param {*} a
     * @param {*} b
     * @param {*} [opt]
     * @private
     */
    static copy(a, b, opt={})
    {
        const { skipUpdate } = opt;
        return this.set(a, this.get(b, {}, { skipIds: true }), { skipUpdate, verb: "copy" });
    }

    /**
     * Internal handler for cloning an object
     * @param {*} a
     * @param {*} [opt]
     * @private
     */
    static clone(a, opt)
    {
        return this.from(this.get(a, {}, { skipIds: true }), opt);
    }

    /**
     * Internal handler for setting an object's values from a plain object
     * @param {*} a
     * @param {*} [values]
     * @param {*} [opt]
     * @returns {boolean}
     * @private
     */
    static set(a, values, opt={})
    {
        // if verb = "copy" then empty all children
        throw new ErrAbstractClassMethod();
    }

    /**
     * Internal handler for getting an object's value as a plain object
     * @param {*} a
     * @param {*} [out={}]
     * @param {*} [opt]
     * @returns {*} out
     * @private
     */
    static get(a, out = {}, opt={})
    {
        throw new ErrAbstractClassMethod();
    }

    /* ----------------------------------------------------------------------------------------------------------------

                                                   Event Emitter

    -----------------------------------------------------------------------------------------------------------------*/

    /**
     * Emits an event
     * @param eventName
     * @param eventData
     * @returns {*}
     */
    EmitEvent(eventName, eventData = {})
    {
        if (this._events && eventName in this._events)
        {
            eventData.evt = eventData.evt || eventName;
            eventData.ctx = eventData.ctx || this;

            this._events[eventName].forEach((opt, key) =>
            {
                key.call(opt.context, eventData);
                if (opt.once)
                {
                    this._events[eventName].delete(key);
                }
            });
        }
        return this;
    }

    /**
     * Adds a listener to an event
     * @param eventName
     * @param listener
     * @param [context]
     * @param [once]
     * @returns {*}
     */
    OnEvent(eventName, listener, context, once)
    {
        if (!this._events)
        {
            this._events = {};
        }

        if (!this._events[eventName])
        {
            this._events[eventName] = new Set();
        }

        this._events[eventName].add(listener, {context, once});
        return this;
    }

    /**
     * Adds a listener to an event and removes after the first emit
     * @param eventName
     * @param listener
     * @param [context]
     * @returns {*}
     */
    OnceEvent(eventName, listener, context)
    {
        return this.OnEvent(eventName, listener, context, true);
    }

    /**
     * Checks if an event name has a listener
     * @param eventName
     * @returns {boolean}
     */
    HasEventListener(eventName)
    {
        return this._events ? eventName in this._events && this._events[eventName].size > 0 : false;
    }

    /**
     * Removes a listener from an event
     * @param eventName
     * @param listener
     * @returns {*}
     */
    OffEvent(eventName, listener)
    {
        if (this._events && eventName in this._events)
        {
            this._events[eventName].delete(listener);
        }
        return this;
    }

    /**
     * Clears all listeners off an event
     * @param eventName
     * @returns {*}
     */
    ClearEvent(eventName)
    {
        if (this._events && eventName in this._events)
        {
            this._events[eventName].clear();
            Reflect.delete(this._events, eventName);
        }
        return this;
    }

    /**
     * Purges all events
     * @returns {*}
     */
    PurgeEvents()
    {
        if (this._events)
        {
            for (const eventName in this._events)
            {
                if (this._events.hasOwnProperty(eventName))
                {
                    this.ClearEvent(eventName);
                }
            }
            Reflect.deleteProperty(this, "_events");
        }
        return this;
    }

    /* ----------------------------------------------------------------------------------------------------------------

                                                    Change handlers

    -----------------------------------------------------------------------------------------------------------------*/

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
        if (!opt || !opt.skipEvents)
        {
            this.EmitEvent("modified", opt);
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
        if (!opt || !opt.skipEvents)
        {
            this.EmitEvent("destroy", opt);
        }
        this.PurgeEvents();
    }

    /* ----------------------------------------------------------------------------------------------------------------

                                                    Traversal

    -----------------------------------------------------------------------------------------------------------------*/

    /**
     * Traverses the object
     * @param {Function} callback
     * @returns {*}
     */
    Traverse(callback)
    {
        const result = callback(this);
        if (result) return result;

        function onChild(child, parent, property, index)
        {
            if (isFunction(child.Traverse))
            {
                const result = child.Traverse(callback);
                if (result) return result;
            }
        }

        return this.constructor.perChild(this, onChild);
    }

    /**
     * Fires a callback on an object's children, and no further
     * @param {*} obj
     * @param {Function} callback
     * @returns {!*}
     */
    static perChild(obj, callback)
    {
        if (!obj.constructor.__keys)
        {
            obj.constructor.cacheKeys(obj);
        }

        const {array, object} = obj.constructor.__keys;

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
                        const result = callback(item, this, key, x);
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
                    const result = callback(item, this, key);
                    if (result) return result;
                }
            }
        }

    }

    /**
     * Caches the classes keys
     * -- Fallback if schema not present
     * @param {*} obj
     */
    static cacheKeys(obj)
    {
        const cache = obj.constructor.__keys || {};

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

        obj.constructor.__keys = cache;
    }

    /* ----------------------------------------------------------------------------------------------------------------

                                                    Meta data

    -----------------------------------------------------------------------------------------------------------------*/

    /**
     * The classes's keys cached into their types
     * @type {?{}}
     * @private
     */
    static __keys = null;

    /**
     * Identifies that the class is being developed and may not be functional
     * @type {Boolean}
     * @private
     */
    static __isStaging = false;

    /* ----------------------------------------------------------------------------------------------------------------

                                                        Schema

    -----------------------------------------------------------------------------------------------------------------*/

    /**
     * Defines a classes schema
     * @param Constructor
     * @param func
     */
    static define(Constructor, func)
    {
        return Tw2Schema.create(Constructor, func, this !== Tw2BaseClass ? this : undefined);
    }

    /**
     * Black definition
     * @type {null}
     */
    static black = null;

}