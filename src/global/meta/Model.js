import { generateID } from "../utils/uuid";
import { isArray, isFunction, isObjectObject, isString } from "../utils/type";
import { Tw2Schema } from "./Tw2Schema";
import { tw2 } from "global/tw2";

const getPropType = (type) => tw2 && tw2.propertyTypes && tw2.propertyTypes.Get(type);

// TODO: Identify why Model can't extend * without webpack having a fit

const PRIVATE = new WeakMap();
const id = Symbol("id");

export class Model
{

    get _id()
    {
        if (!this[id]) this[id] = generateID();
        return this[id];
    }

    [id] = null;

    /**
     * Emits an event
     * @param {String} eventName
     * @param args
     * @returns {*}
     */
    EmitEvent(eventName, ...args)
    {
        const events = PRIVATE.get(this);
        if (!events) return this;

        eventName = eventName.toLowerCase();

        if (events[eventName])
        {
            events[eventName].forEach((value, key) =>
            {
                key.call(value.context, ...args);
                if (value.once) events[eventName].delete(key);
            });

            if (events[eventName] && events[eventName].size === 0)
            {
                Reflect.deleteProperty(events, eventName);
            }
        }

        return this;
    }

    /**
     * Adds events from a plain object
     * @param {Object} options
     * @returns {*}
     */
    AddEvents(options)
    {
        if (!options) return this;

        for (let key in options)
        {
            if (options.hasOwnProperty(key))
            {
                let listener = options[key],
                    eventName = key,
                    context,
                    once;

                // Append ".once" to event name to fire only once
                if (key.indexOf(".once") !== -1)
                {
                    if (key.lastIndexOf(".once") === key.length - 5)
                    {
                        eventName = key.substring(0, key.length - 5);
                        once = true;
                    }
                }

                // options as an array/ arguments
                if (isArray(listener))
                {
                    listener = listener[0];
                    context = listener[1];
                }

                if (!isFunction(listener))
                {
                    throw new Error("Invalid listener");
                }

                this.OnEvent(eventName, listener, context, once);
            }
        }

        return this;
    }

    /**
     * Adds a listener to an event
     * @param {Array|String} eventName
     * @param {Function} listener
     * @param {*} [context]
     * @param {Boolean} [once]
     * @returns {*}
     */
    OnEvent(eventName, listener, context, once)
    {
        let events = PRIVATE.get(this);

        if (!events)
        {
            events = {};
            PRIVATE.set(this, events);
        }

        eventName = eventName.toLowerCase();

        if (!events[eventName])
        {
            events[eventName] = new Map();
        }

        // Allow intercepting of a listener when its first added
        if (!events[eventName].has(listener))
        {
            if (this.constructor.onListener)
            {
                if (this.constructor.onListener(this, eventName, listener, context) && once)
                {
                    return this;
                }
            }
            else if (this["OnEventFirstListener"])
            {
                if (this["OnEventFirstListener"](this, eventName, listener, context) && once)
                {
                    return this;
                }
            }
        }

        events[eventName].set(listener, { context: context, once: once });
        return this;
    }

    /**
     * Adds a listener to an event, and clears it after it's first EmitEvent
     * @param {String} eventName
     * @param {Function} listener
     * @param {*} [context]
     * @returns {*}
     */
    OnceEvent(eventName, listener, context)
    {
        return this.OnEvent(eventName, listener, context, true);
    }

    /**
     * Removes a listener from a specific event or from all events by passing "*"
     * @param {String} eventName
     * @param {Function} listener
     * @returns {*}
     */
    OffEvent(eventName, listener)
    {
        const events = PRIVATE.get(this);
        if (!events) return this;

        // Remove listener from all events
        if (eventName === "*")
        {
            for (const eventName in events)
            {
                if (events.hasOwnProperty(eventName))
                {
                    events[eventName].delete(listener);
                    if (events[eventName].size === 0)
                    {
                        Reflect.deleteProperty(events, eventName);
                    }
                }
            }
            return this;
        }

        eventName = eventName.toLowerCase();
        if (eventName in events)
        {
            events[eventName].delete(listener);
            if (events[eventName].size === 0)
            {
                Reflect.deleteProperty(events, eventName);
            }
        }

        return this;
    }

    /**
     * Checks if a listener exists on an event, or on any event by passing "*"
     * @param {String} eventName
     * @param {String|Function} listener
     * @returns {boolean}
     */
    HasEvent(eventName, listener)
    {
        const events = PRIVATE.get(this);
        if (!events) return false;

        // Check all events
        if (eventName === "*")
        {
            for (const key in events)
            {
                if (events.hasOwnProperty(key))
                {
                    if (events[key].has(listener))
                    {
                        return true;
                    }
                }
            }
            return false;
        }

        if (listener && eventName in events)
        {
            return listener === "*" ? !!events[eventName].size : events[eventName].has(listener);
        }

        return false;
    }

    /**
     * Clears an event of listeners
     * @param {String} eventName
     * @returns {*}
     */
    ClearEvent(eventName)
    {
        const events = PRIVATE.get(this);
        if (!events) return this;

        if (eventName === "*")
        {
            PRIVATE.delete(this);
            return this;
        }

        eventName = eventName.toLowerCase();
        if (eventName in events)
        {
            events[eventName].clear();
            Reflect.deleteProperty(events, eventName);
        }
        return this;
    }


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
     * @param {Object} [opt]
     */
    UpdateValues(opt)
    {
        const skipEvents = opt && opt.skipEvents;
        if (!skipEvents) this.EmitEvent("modify", this, opt);
        if (this["OnValueChanged"]) this["OnValueChanged"](opt);
        if (!skipEvents) this.EmitEvent("modified", this, opt);
    }

    /**
     * Adds a listener to modified events
     * @param method
     * @param context
     * @param once
     */
    OnModified(method, context, once)
    {
        this.OnEvent("modified", method, context, once);
    }

    /**
     * Removes a listener from modified events
     * @param method
     * @constructor
     */
    OffModified(method)
    {
        this.OffEvent("modified", method);
    }

    /**
     * Prepares the instance for destruction
     * @param opt
     */
    Destroy(opt = {})
    {
        if (!opt || !opt.skipEvents)
        {
            this.EmitEvent("destroy", this, opt);
        }

        if (this["OnDestroy"])
        {
            this["OnDestroy"]();
        }

        if (!opt || !opt.skipChildren)
        {
            this.Clear({ skipUpdate: true, skipEvents: true, controller: opt.controller });
        }

        if (!opt || !opt.skipEvents)
        {
            this.EmitEvent("destroyed", this, opt);
        }

        this.ClearEvent("*");
    }

    /**
     * Clears all child objects
     * @param {Object} [opt={}]
     */
    Clear(opt = {})
    {
        let updated;

        if (!opt.skipEvents)
        {
            this.EmitEvent("clear", this);
        }

        if (this["OnClear"])
        {
            this["OnClear"]();
        }

        let childOpt;

        const
            schema = Tw2Schema.Get(this.constructor),
            structLists = schema.GetStructLists(),
            structs = schema.GetStructs();

        if (structLists.length)
        {
            structLists.forEach(property =>
            {
                const key = property.name;
                if (property.isPrivate) return;

                for (let i = 0; i < this[key].length; i++)
                {
                    if (this[key][i])
                    {
                        if (property.isOwned && this[key][i].Destroy)
                        {
                            this[key][i].Destroy({ controller: opt.controller });
                        }
                        updated = true;
                    }
                }

                this[key].splice(0);
            });
        }

        if (structs.length)
        {
            structs.forEach(property =>
            {
                const key = property.name;
                if (property.isPrivate) return;

                if (this[key])
                {
                    if (property.isOwned && this[key].Destroy)
                    {
                        childOpt = childOpt || { controller: opt.controller };
                        this[key].Destroy(childOpt);
                    }
                    this[key] = null;
                    updated = true;
                }
            });
        }

        if (!opt || !opt.skipEvents)
        {
            this.EmitEvent("cleared", this);
        }

        if (updated && (!opt || !opt.skipUpdate))
        {
            this.UpdateValues(opt);
        }
    }

    /**
     * Fires a function per child struct
     * @param {Function}  func
     * @param {Boolean} [includeEmpty]
     * @returns {*}
     */
    PerChild(func, includeEmpty)
    {
        const
            schema = Tw2Schema.Get(this.constructor),
            structs = schema.GetStructs(),
            structLists = schema.GetStructLists();

        if (structs.length)
        {
            for (let i = 0; i < structs.length; i++)
            {
                const
                    property = structs[i],
                    key = property.name,
                    struct = this[key];

                if (property.isPrivate)
                {
                    continue;
                }

                if (struct || includeEmpty)
                {
                    const path = `/${key}`;
                    const rv = func({ parent: this, key, struct, path });
                    if (rv !== undefined) return rv;
                }
            }
        }

        if (structLists.length)
        {
            for (let i = 0; i < structLists.length; i++)
            {
                const
                    property = structLists[i],
                    key = property.name,
                    array = this[key];

                if (property.isPrivate)
                {
                    continue;
                }

                for (let index = 0; index < array.length; index++)
                {
                    const struct = array[index];
                    if (struct || includeEmpty)
                    {
                        const path = `/${key}/${index}`;
                        const rv = func({ parent: this, key, struct, array, index, path });
                        if (rv !== undefined) return rv;
                    }
                }
            }
        }
    }

    /**
     * Filters all structs
     * Todo: Refactor
     * @param {Function} func  - the function to call on each struct
     * @param {Array} [out=[]] - optional receiving array
     * @returns {Array} out    - all structs where the func returned true
     */
    Filter(func, out)
    {
        console.log("'Filter' has been replaced with 'FilterStruct'");
        return this.FilterStruct(func, out);
    }

    /**
     * Filters all structs
     * @param {Function} func  - the function to call on each struct
     * @param {Array} [out=[]] - optional receiving array
     * @returns {Array} out    - all structs where the func returned true
     */
    FilterStruct(func, out = [])
    {
        this.Traverse(opt =>
        {
            if (func(opt.struct, opt) && !out.includes(opt.struct))
            {
                out.push(opt.struct);
            }
        });

        return out;
    }

    /**
     * Gets every child struct that currently exposes a named permutation option
     * (e.g. an effect whose shader has a "BLEND_MODE" option), optionally
     * narrowed by a filter. Walks the whole struct graph, so it works from any
     * node (`EveShip2`, `Tw2Mesh`, `Tw2MeshArea`, `Tw2Effect`, ...).
     *
     * This is a query: it only matches effects whose resource is loaded, since
     * the option surface comes from the effect resource. To *set* an option in a
     * way that also reaches not-yet-loaded effects, use {@link SetEffectsOption}.
     * @param {String} option      - permutation option name, e.g. "BLEND_MODE"
     * @param {Function} [filter]   - optional predicate `(struct) => boolean`
     * @param {Array} [out=[]]
     * @returns {Array} out         - the matching structs (usually effects)
     */
    GetEffectsWithOption(option, filter, out = [])
    {
        return this.FilterStruct(
            (struct) => !!struct
                && typeof struct.HasOption === "function"
                && struct.HasOption(option)
                && (!filter || filter(struct)),
            out
        );
    }

    /**
     * Sets a permutation option across the graph from one place (the "set once,
     * apply to each supporting shader" case).
     *
     * Robust to load order: it applies the value to effects that already expose
     * the option, AND to effects whose resource has not loaded yet - those store
     * the value on `options`, and `OnResPrepared` applies it on load if the
     * shader has the option (or harmlessly ignores it if not). Loaded effects
     * that do not have the option are skipped. Scope with `filter` (e.g. to a
     * shader family) so the optimistic pre-load set is not sprayed everywhere.
     * @param {String} option              - option name, e.g. "BLEND_MODE"
     * @param {String} value               - option value, e.g. "BLEND_MODE_SUBTRACT"
     * @param {Function} [filter]          - optional predicate `(effect) => boolean`
     * @param {Boolean} [autoPopulate=true] - rebuild each loaded effect after setting
     * @returns {Array} the effects whose option value changed
     */
    SetEffectsOption(option, value, filter, autoPopulate = true)
    {
        const updated = [];
        this.Traverse((opt) =>
        {
            const struct = opt.struct;
            if (!struct || typeof struct.SetOption !== "function") return;
            if (filter && !filter(struct)) return;

            const res = struct.effectRes;
            const loaded = !!(res && res.IsGood && res.IsGood() && res.HasPrepared && res.HasPrepared());
            const supports = typeof struct.HasOption === "function" && struct.HasOption(option);
            if (loaded && !supports) return;

            if (struct.SetOption({ [option]: value }, autoPopulate)) updated.push(struct);
        });
        return updated;
    }

    /**
     * Finds an object by it's id
     * @param {String} id
     * @param {Array} [out] - Optional array for capturing the path to the found object
     * @return {*}
     */
    FindObjectByID(id, out)
    {
        return this.Traverse(x =>
        {
            if (x.struct._id === id)
            {
                if (out)
                {
                    const parts = x.path.split("/");
                    parts.shift(); // remove root

                    let cur = this;
                    for (let i = 0; i < parts.length; i++)
                    {
                        cur = cur[parts[i]];
                        out.push(cur);
                    }
                }

                return x.struct;
            }
        });
    }

    /**
     * Finds the first struct to satisfy a function
     * @param {Function} func
     * @return {Array} out
     */
    FindStruct(func)
    {
        this.Traverse(opt =>
        {
            if (func(opt.struct, opt)) return opt.struct;
        });

        return null;
    }

    /**
     * Traverses the object and it's child structs
     * @param {Function} func
     * @param {Object} [_opt={}]
     * @param {Set} [_visited=new Set()]
     * @returns {*}
     */
    Traverse(func, _opt = {}, _visited = new Set())
    {
        if (_visited.has(this))
        {
            return;
        }

        _visited.add(this);

        _opt.path = _opt.path || "root";
        _opt.struct = this;

        const rv = func(_opt);
        if (rv !== undefined) return rv;

        return this.PerChild(x =>
        {
            if (x.struct && x.struct.Traverse)
            {
                x.path = _opt.path + x.path;
                const rv = x.struct.Traverse(func, x, _visited);
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
     * Gets a prop's type
     * @param {String} prop
     * @returns {Number|null}
     */
    GetPropType(prop)
    {
        return this.constructor.getPropType(this, prop);
    }

    /**
     * Gets a prop's normalized type name
     * @param {String} prop
     * @returns {String|null}
     */
    GetPropTypeName(prop)
    {
        return this.constructor.getPropTypeName(this, prop);
    }

    /**
     * Gets a prop's black reader helper type
     * @param {String} prop
     * @returns {String|null}
     */
    GetPropBlackReaderType(prop)
    {
        return this.constructor.getPropBlackReaderType(this, prop);
    }

    /**
     * Checks if a property is private
     * @param {String} prop
     * @returns {boolean}
     */
    IsPropPrivate(prop)
    {
        return this.constructor.isPropPrivate(this, prop);
    }

    /**
     * Gets the class's type name
     * @returns {String|null}
     */
    GetClassName()
    {
        return this.constructor.getClassName(this);
    }

    /**
     * Gets the classes CCP name
     * @returns {String|null}
     */
    GetCCPName()
    {
        return this.constructor.getClassCCPName(this);
    }

    /**
     * Gets a class definition
     * @param {String} namespace
     * @returns {?Object}
     */
    GetClassDefinition(namespace)
    {
        return this.constructor.getClassDefinition(this, namespace);
    }

    /**
     * Gets a class definition name
     * @param {String} namespace
     * @returns {?String}
     */
    GetClassDefinitionName(namespace)
    {
        return this.constructor.getClassDefinitionName(this, namespace);
    }

    /**
     * Gets class definitions
     * @returns {?Object}
     */
    GetClassDefinitions()
    {
        return this.constructor.getClassDefinitions(this);
    }

    static getConstructor(obj)
    {
        return isFunction(obj) ? obj : obj.constructor;
    }

    static getClassCCPName(obj)
    {
        const ccpDefinition = this.getClassDefinitionName(obj, "ccp");
        if (ccpDefinition) return ccpDefinition;

        const ccp = Tw2Schema.Get(this.getConstructor(obj)).GetCCP();
        return ccp ? ccp : this.getClassName(obj);
    }

    static getClassName(obj)
    {
        const type = Tw2Schema.Get(this.getConstructor(obj)).GetType();
        return isString(type) ? type : null;
    }

    static getClassDefinitions(obj)
    {
        return Tw2Schema.Get(this.getConstructor(obj)).GetDefinitions();
    }

    static getClassDefinition(obj, namespace)
    {
        return Tw2Schema.Get(this.getConstructor(obj)).GetDefinition(namespace);
    }

    static getClassDefinitionName(obj, namespace)
    {
        return Tw2Schema.Get(this.getConstructor(obj)).GetDefinitionName(namespace);
    }

    static getPropType(obj, prop)
    {
        const property = Tw2Schema.Get(this.getConstructor(obj)).GetResolvedProperty(prop, obj);
        return property ? property.type : null;
    }

    static getPropTypeName(obj, prop)
    {
        const property = Tw2Schema.Get(this.getConstructor(obj)).GetResolvedProperty(prop, obj);
        return property ? property.propertyTypeName : null;
    }

    static getPropBlackReaderType(obj, prop)
    {
        const property = Tw2Schema.Get(this.getConstructor(obj)).GetResolvedProperty(prop, obj);
        return property ? property.blackReaderType : null;
    }

    static isPropPrivate(obj, prop)
    {
        const property = Tw2Schema.Get(this.getConstructor(obj)).GetResolvedProperty(prop, obj);
        return !!(property && property.isPrivate);
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
        const schema = Tw2Schema.Get(this);

        if (!schema.GetType())
        {
            throw new ReferenceError("No meta type defined");
        }

        const isFirstGet = !opt._ids;

        if (isFirstGet)
        {
            opt._ids = new Map();
        }
        else if (opt._ids.has(item))
        {
            const result = { __ref: item._id };
            opt._ids.get(item).push(result);
            return result;
        }

        out = out || {};
        for (const key in out)
        {
            if (out.hasOwnProperty(key))
            {
                Reflect.deleteProperty(out, key);
            }
        }

        out.__type = schema.GetType();
        out.__id = item._id;

        opt._ids.set(item, [ out ]);

        for (const key in item)
        {
            if (item.hasOwnProperty(key))
            {
                const property = schema.GetProperty(key, item);
                if (property && !property.isPrivate && !property.alias)
                {
                    const handler = getPropType(property.type);
                    if (!handler)
                    {
                        throw new TypeError("Unknown type: " + property.type);
                    }
                    out[key] = handler.Get(item, key, opt);
                }
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

                let id = "#" + count++;
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

        const
            schema = Tw2Schema.Get(this),
            constructorType = schema.GetType();

        if (!constructorType)
        {
            throw new ReferenceError("No meta type defined");
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
            item.Clear({ skipUpdate: true, skipEvents: true });
        }

        let skipped;

        let updated = false;
        if (values)
        {
            for (let key in values)
            {
                if (values.hasOwnProperty(key))
                {
                    const value = values[key];
                    let property = schema.GetProperty(key, item);

                    /** DEBUGGING START **/
                    if (values[key] === undefined)
                    {
                        skipped = skipped || {};
                        skipped.undefined = skipped.undefined || [];
                        skipped.undefined.push(key);
                        continue;
                    }

                    if (property && property.isPrivate)
                    {
                        skipped = skipped || {};
                        skipped.private = skipped.private || [];
                        skipped.private.push(key);
                        continue;
                    }

                    // Allow aliasing
                    const alias = schema.GetAliasTarget(key, item);
                    if (alias)
                    {
                        key = alias;
                        property = schema.GetProperty(key, item);
                    }

                    if (property && property.isPrivate)
                    {
                        skipped = skipped || {};
                        skipped.private = skipped.private || [];
                        skipped.private.push(key);
                        continue;
                    }

                    if (!property)
                    {
                        skipped = skipped || {};
                        skipped.noType = skipped.noType || [];
                        skipped.noType.push(key);
                        continue;
                    }
                    /** DEBUGGING END **/

                    const
                        type = property.type,
                        handler = getPropType(type);

                    if (!handler)
                    {
                        throw new TypeError(`${constructorType} > Unknown property type: ${type}`);
                    }

                    // Delete
                    if (value === null && handler.Delete)
                    {
                        if (handler.Delete(item, key, options))
                        {
                            updated = true;
                        }

                        continue;
                    }

                    if (!handler.Is(value))
                    {
                        throw new TypeError(`${constructorType} > Unexpected value type for property: ${key}`);
                    }

                    if (handler.Equals(value, item[key]))
                    {
                        continue;
                    }

                    if (handler.Set(item, key, value, options) !== false)
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

        if (skipped)
        {
            tw2.Debug({
                name: `${constructorType}.set`,
                message: "Properties values skipped",
                data: skipped
            });
        }

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

        if (values && values.__type && Tw2Schema.Get(this).GetType() !== values.__type)
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

    static is(obj)
    {
        return obj instanceof this;
    }

}
