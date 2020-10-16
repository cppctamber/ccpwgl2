import { Tw2EventEmitter } from "core/class/Tw2EventEmitter";
import { generateID, getMetadata, hasMetadata, isObjectObject, isPlain } from "../util";
import { propTypes } from "./types";
import { readOnly } from "global/meta/@generic";
import { logger } from "global/tw2";


export class Model extends Tw2EventEmitter
{

    @readOnly
    _id = generateID();

    /**
     * Copies an instance's values
     * @param {*} a
     * @param {Object} opt
     * @returns {*}
     */
    Copy(a, opt)
    {
        return this.constructor.copy(this, a, opt);
    }

    /**
     * Clones an instance
     * @param {Object} [opt]
     * @returns {*}
     */
    Clone(opt)
    {
        return this.constructor.clone(this, opt);
    }

    /**
     * Sets an instances values from a plain  object
     * @param {Object} [values]
     * @param {Object} [opt]
     * @returns {*}
     */
    SetValues(values, opt = {})
    {
        return this.constructor.set(this, values, opt);
    }

    /**
     * Gets an instance's values as a plain object
     * @param {Object} [out]
     * @param {Object} [opt]
     * @returns {Object}
     */
    GetValues(out, opt)
    {
        return this.constructor.get(this, out, opt);
    }

    /**
     * Fires on value updates
     * @param opt
     */
    UpdateValues(opt = {})
    {
        const { skipEvents, ...options } = opt;

        if (!skipEvents)
        {
            this.EmitEvent("modify", this, opt);
        }

        if (this["OnValueChanged"])
        {
            this["OnValueChanged"](options);
        }

        if (!skipEvents)
        {
            this.EmitEvent("modified", this, opt);
        }
    }

    /**
     * Adds a listener to modified events
     * @param method
     * @param context
     * @param once
     */
    OnModified(method, context, once)
    {
        logger.Debug("OnModified is deprecated, use OnEvent");
        this.OnEvent("modified", method, context, once);
    }

    /**
     * Removes a listener from modified events
     * @param method
     * @constructor
     */
    OffModified(method)
    {
        logger.Debug("OffModified is deprecated, use OffEvent");
        this.OffEvent("modified", method);
    }

    /**
     * Prepares the instance for destruction
     * @param opt
     */
    Destructor(opt = {})
    {
        const { skipEvents, clearChildren, ...options } = opt;

        if (!skipEvents)
        {
            this.EmitEvent("destruct", this, options);
        }

        if (this["OnDestruct"])
        {
            this["OnDestruct"](options);
        }

        if (clearChildren)
        {
            this.Clear({ skipUpdate: true, skipEvents: true });
        }

        if (!skipEvents)
        {
            this.EmitEvent("destructed", this, options);
        }

        this.ClearEvent("*");
    }

    /**
     * Clears a child's objects
     * @param opt
     */
    Clear(opt = {})
    {
        // Reset all children to their default values...
        throw new Error("Not implemented");

        /*
        const { skipUpdate, skipEvent, ...options } = opt;

        let updated;

        if (!skipEvent)
        {
            this.EmitEvent("clear", this);
        }

        if (this["OnClear"])
        {
            this["OnClear"](options);
        }

        // Clear any struct lists
        if (hasMetadata("structLists", this.constructor))
        {
            const structLists = getMetadata("structLists", this.constructor);
            structLists.forEach(property =>
            {
                if (getMetadata("isPrivate", this, property)
                {
                    return;
                }

                for (let i = 0; i < this[property].length; i++)
                {
                    if (this[property][i])
                    {
                        if (this[property][i].Destructor)
                        {
                            this[property][i].Destructor(options);
                        }
                        updated = true;
                    }
                }
                this[property].splice(0);
            });
        }

        // Clear any structs
        if (hasMetadata("structs", this.constructor))
        {
            const structs = getMetadata("structs", this.constructor);
            structs.forEach(property =>
            {
                if (getMetadata("isPrivate", this, property)
                {
                    return;
                }

                if (this[property])
                {
                    if (this[property].Destructor)
                    {
                        this[property].Destructor(options);
                    }
                    updated = true;
                    this[property] = null;
                }
            });
        }

        if (!skipEvent)
        {
            this.EmitEvent("cleared", this);
        }

        if (updated && !skipUpdate)
        {
            this.UpdateValues(options);
        }
        */
    }

    /**
     * Fires a function per child struct
     * @param {Function}  func
     * @param {Boolean} [ignoreEmpty]
     * @returns {*}
     */
    PerChild(func, ignoreEmpty)
    {
        if (hasMetadata("structs", this.constructor))
        {
            const structs = getMetadata("structs", this.constructor);
            for (let i = 0; i < structs.length; i++)
            {
                const
                    key = structs[i],
                    struct = this[key];

                if (getMetadata("isPrivate", this, key))
                {
                    continue;
                }

                if (struct || !ignoreEmpty)
                {
                    const path = `/${key}`;
                    const rv = func({ parent: this, key, struct, path });
                    if (rv !== undefined) return rv;
                }
            }
        }

        if (hasMetadata("structLists", this.constructor))
        {
            const structLists = getMetadata("structLists", this.constructor);
            for (let i = 0; i < structLists.length; i++)
            {
                const
                    key = structLists[i],
                    array = this[structLists[i]];

                if (getMetadata("isPrivate", this, key))
                {
                    continue;
                }

                for (let index = 0; index < array.length; index++)
                {
                    const struct = array[index];
                    const path = `/${key}/${index}`;
                    const rv = func({ parent: this, key, struct, array, index, path });
                    if (rv !== undefined) return rv;
                }
            }
        }
    }

    /**
     * Filters all structs
     * @param {Function} func  - the function to call on each struct
     * @param {Array} [out=[]] - optional receiving array
     * @returns {Array} out    - all structs where the func returned true
     */
    Filter(func, out = [])
    {
        this.Traverse(opt =>
        {
            if (func(opt) && !out.includes(opt.struct))
            {
                out.push(opt.struct);
            }
        });

        return out;
    }

    /**
     * Traverses the object and it's child structs
     * @param {Function} func
     * @param {Object} [opt={}]
     * @param {Set} [visited=new Set()]
     * @returns {*}
     */
    Traverse(func, opt = {}, visited = new Set())
    {
        if (visited.has(this))
        {
            return;
        }

        visited.add(this);

        opt.path = opt.path || "root";
        opt.struct = this;

        const rv = func(opt);
        if (rv !== undefined) return rv;

        return this.PerChild(o =>
        {
            if (o.struct && o.struct.Traverse)
            {
                o.path = opt.path + o.path;
                const rv = o.struct.Traverse(func, o, visited);
                if (rv !== undefined) return rv;
            }
        });
    }

    /**
     * Gets async tasks
     * @param {Set} out
     * @returns {Set<Promise>}
     */
    GetAsyncTasks(out = new Set())
    {
        return out;
    }

    /**
     *
     * @param a
     * @param b
     * @param opt
     * @returns {boolean}
     */
    static copy(a, b, opt = {})
    {
        return this.set(a, b.GetValues(), { _clear: true, ...opt });
    }

    /**
     *
     * @param a
     * @param opt
     * @returns {{Initialize}}
     */
    static clone(a, opt)
    {
        return this.from(a.GetValues(), opt);
    }

    /**
     * Serializes an item
     * @param {*} item          - the item to serialize
     * @param {Object} [out={}] - optional receiving object
     * @param {Object} [opt={}] - options
     * @returns {Object} out
     */
    static get(item, out = {}, opt = {})
    {
        if (!hasMetadata("type", this)) throw new ReferenceError("No meta type defined");

        const isFirstGet = !opt._ids;

        if (!opt._ids)
        {
            opt._ids = new Map();
        }
        else if (opt._ids.has(item))
        {
            const result = { __ref: item._id };
            opt._ids.get(item).push(result);
            return result;
        }

        out = {
            __type: getMetadata("type", item.constructor),
            __id: item._id
        };

        opt._ids.set(item, [ out ]);

        for (const key in item)
        {
            if (item.hasOwnProperty(key) && hasMetadata("type", item, key) && !getMetadata("isPrivate", item, key))
            {
                const
                    type = getMetadata("type", item, key),
                    handler = propTypes.get(type);

                if (!handler)
                {
                    throw new TypeError("Unknown type: " + type);
                }

                out[key] = handler.get(item, key, opt);
            }
        }

        // Strip out object ids
        // Replace any duplicates with interim string ids
        if (isFirstGet && !opt["useObjectIds"])
        {
            let count = 0;

            opt._ids.forEach(value =>
            {
                // No need for the id if there is only one object
                if (value.length === 1)
                {
                    Reflect.deleteProperty(value[0], "__id");
                    return;
                }

                let id = "#" +  count++;
                for (let i = 0; i < value.length; i++)
                {
                    if (i === 0)
                    {
                        value[i].__id = id;
                    }
                    else
                    {
                        value[i].__ref = id;
                    }
                }
            });
        }

        return out;
    }

    /**
     * Sets an items values from a plain object
     * TODO: Reduce values to only be those that would result in a change to the object?
     * @param {*} item          - the item to set
     * @param {Object} [values] - the values to set
     * @param {Object} [opt={}] - set options
     * @returns {boolean}       - true if updated
     */
    static set(item, values, opt = {})
    {
        if (item.constructor !== this)
        {
            throw new ReferenceError("Invalid constructor");
        }

        if (!hasMetadata("type", this))
        {
            throw new ReferenceError("Not meta type defined");
        }

        if (values && !isObjectObject(values))
        {
            throw new ReferenceError("Invalid values, expected plain object or object");
        }

        let { _clear, _ids = new Map, skipEvents, skipUpdate, ...options } = opt;

        if (_ids.has(item))
        {
            return _ids.get(item);
        }

        options._ids = _ids;

        // We'll need to clear all structs when copying...
        if (_clear)
        {
            throw new Error("Copy feature not implemented");
            //if (!values) throw new ReferenceError("Unexpected...");
            //item.Clear({ skipUpdate: true, skipEvents: true });
        }

        let updated = false;
        if (values)
        {
            for (const key in values)
            {
                if (values.hasOwnProperty(key) && hasMetadata("type", item, key) && !getMetadata("isPrivate", item, key))
                {
                    const
                        type = getMetadata("type", item, key),
                        value = values[key],
                        handler = propTypes.get(type);

                    if (!handler)
                    {
                        throw new TypeError("Unknown type: " + type);
                    }

                    // Delete
                    if (value === null && handler.delete)
                    {
                        if (handler.delete(item, key, options))
                        {
                            updated = true;
                        }

                        continue;
                    }

                    if (!handler.is(value, item[key], options))
                    {
                        throw new TypeError("Invalid value for property " + key);
                    }

                    if (handler.equals(value, item[key]))
                    {
                        continue;
                    }

                    if (handler.set(item, key, value, options))
                    {
                        updated = true;
                    }
                }
            }
        }

        if (updated && !skipUpdate)
        {
            item.UpdateValues(options);
        }

        _ids.set(item, updated);

        return updated;
    }

    /**
     * Creates an instance from values
     * TODO: Ensure we are passed the correct values
     * @param {Object} [values] - values to set
     * @param {Object} [opt={}] - create options
     * @returns {*}
     */
    static from(values, opt = {})
    {
        const { skipUpdate, ...options } = opt;

        let item;

        if (values && values.__type && getMetadata("type", this) !== values.__type)
        {
            throw new ReferenceError("Unexpected constructor " + values.__type);
        }

        if (values && values instanceof this)
        {
            item = values;
        }
        else
        {
            item = new this();

            if (values)
            {
                item.SetValues(values, { skipUpdate: true, ...options });
            }
        }

        if (!skipUpdate && item.Initialize)
        {
            item.Initialize();
        }

        return item;
    }

}

