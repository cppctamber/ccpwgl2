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
     */
    constructor()
    {
        const schema = Tw2Schema.get(this.constructor);
        if (schema) schema.OnInstantiation(this);
    }

    /* ----------------------------------------------------------------------------------------------------------------

                                                    Utilities

    -----------------------------------------------------------------------------------------------------------------*/

    /**
     * Copies another object's values
     * @param a
     * @param [opt]
     * @returns {*}
     */
    Copy(a, opt = {})
    {
        const {skipUpdate, skipNames, verb = "copy"} = opt;
        const values = a.GetValues({}, {skipNames, verb});
        return this.SetValues(values, {skipUpdate, verb});
    }

    /**
     * Clones the object
     * @param [opt]
     * @returns {*}
     */
    Clone(opt = {})
    {
        const {skipUpdate, skipNames, verb = "clone"} = opt;
        const values = this.GetValues({}, {skipNames, verb});
        return this.constructor.from(values, {skipUpdate, verb});
    }

    /**
     * Sets the object's values from a plain object
     * @param [values]
     * @param [opt]
     * @returns {Boolean}
     */
    SetValues(values, opt)
    {
        return this.constructor.__setValues(this, values, opt);
    }

    /**
     * Gets the object's values as a plain object
     * @param [out]
     * @param [opt]
     * @returns {*}
     */
    GetValues(out, opt)
    {
        return this.constructor.__getValues(this, out, opt);
    }

    /**
     * Creates an object from values
     * @param [values]
     * @param [opt={}]
     * @returns {Tw2BaseClass}
     */
    static from(values, opt={})
    {
        const { skipUpdate, verb="from" } = opt;

        const item = new this();

        if (values)
        {
            item.SetValues(values, {skipUpdate: true, verb});
        }

        if (!skipUpdate)
        {
            if ("Initialize" in item)
            {
                item.Initialize();
            }
            else
            {
                item.UpdateValues();
            }
        }

        return item;
    }

    /**
     * Sets the object's values
     * @param a
     * @param values
     * @param opt
     * @returns {Boolean}
     */
    static __setValues(a, values, opt)
    {
        const schema = Tw2Schema.get(this);
        if (!schema) throw new ErrAbstractClassMethod();
        return schema.SetValues(a, values, opt);
    }

    /**
     * Gets the object's values
     * @param a
     * @param out
     * @param opt
     * @returns {*}
     */
    static __getValues(a, out, opt)
    {
        const schema = Tw2Schema.get(this);
        if (!schema) throw new ErrAbstractClassMethod();
        return schema.GetValues(a, out, opt);
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
    EmitEvent(eventName, eventData={})
    {
        if (this._events && eventName in this._events)
        {
            eventData.evt = eventData.evt || eventName;
            eventData.ctx = eventData.ctx || this;

            this._events.forEach((listener, options) =>
            {
                listener.call(options.context, eventData);
                if (options.once) this._events[eventName].delete(listener);
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
            this._events[eventName] = new Map();
        }

        this._events[eventName].add(listener, { context, once });
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
     * @param [controller]
     * @param [skipEvents]
     */
    OnValueChanged(controller, skipEvents)
    {

    }

    /**
     * Triggers update handlers
     * @param [controller]
     * @param [skipEvents]
     */
    UpdateValues(controller, skipEvents)
    {
        this.OnValueChanged();

        if (!skipEvents)
        {
            this.EmitEvent("modified", {ctx: this, controller});
        }
    }

    /**
     * Internal handler for object destruction
     * @param [controller]
     * @param [skipEvents]
     */
    OnDestroy(controller, skipEvents)
    {

    }

    /**
     * Destroys the object
     * @param [controller]
     * @param [skipEvents]
     */
    Destroy(controller, skipEvents)
    {
        this.OnDestroy(controller, skipEvents);

        if (!skipEvents)
        {
            this.EmitEvent("destroy", {controller});
        }

        this.PurgeEvents();
    }

    /* ----------------------------------------------------------------------------------------------------------------

                                                    Traversal

    -----------------------------------------------------------------------------------------------------------------*/

    /**
     * Gets child resources
     * @param {Array<Tw2Resource>} [out=[]]
     * @returns {Array<Tw2Resource>} out
     */
    GetResources(out = [])
    {
        const con = this.constructor;
        con.perChild(this, (parent, child) =>
        {
            if (child.constructor.__isResource && !out.includes(child))
            {
                out.push(child);
            }

            if ("GetResources" in child)
            {
                child.GetResources(out);
            }
        });
        return out;
    }

    /**
     * Finds an object with a given id, searching this object and then it's children
     * @param {String|Number} id
     * @returns {null|*}
     */
    FindID(id)
    {
        if (!id) return null;

        if (this._id === id) return this;

        return this.constructor.perChild(this, (parent, child) =>
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
     * @param {String|Number} id
     * @returns {null|*}
     */
    FindIDFromRoot(id)
    {
        return this._parent ? this._parent.FindIDFromRoot(id) : this.FindID(id);
    }

    /**
     * Traverses the object, including itself
     * @param {Function} callback
     * @param {*} [parent]
     * @param {String} [prop]
     * @param {Number} [index]
     * @returns {null|*}
     */
    Traverse(callback, parent, prop, index)
    {
        const result = callback(parent, this, prop, index);
        if (result) return result;

        const con = this.constructor;
        return con.perChild(this, (parent, child, prop, index) =>
        {
            if ("Traverse" in child)
            {
                const result = child.Traverse(callback, parent, prop, index);
                if (result) return result;
            }
        });
    }

    /**
     * Fires a callback on an object's children, and no further
     * @param {*} obj
     * @param {Function} callback
     * @returns {*}
     */
    static perChild(obj, callback)
    {
        if (obj.constructor.__isLeaf) return null;

        const schema = Tw2Schema.get(obj.constructor);
        if (!schema) throw new ErrAbstractClassMethod();
        if (!schema.keys) return null;

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

    /* ----------------------------------------------------------------------------------------------------------------

                                                    Meta data

    -----------------------------------------------------------------------------------------------------------------*/

    /**
     * The classes' type
     * @returns {?String}
     * @private
     */
    static __type = null;

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

}