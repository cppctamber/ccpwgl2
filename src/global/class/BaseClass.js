import { generateID } from "utils/uuid";
import { Tw2EventEmitter } from "core/Tw2EventEmitter";
import { Schema } from "./Schema";

export class BaseClass extends Tw2EventEmitter
{

    _id = null;

    constructor()
    {
        super();
        let _id = null;
        Reflect.defineProperty(this, "_id", { get: () => _id = _id || generateID() });
    }

    /**
     * Prepares an object for destruction
     * @param opt
     */
    Destroy(opt = {})
    {

        if (!opt.controller)
        {
            opt.controller = this;
        }

        if (!opt || !opt.skipEvents)
        {
            this.EmitEvent("destroy", this, opt);
        }

        // Custom destroy callback
        if (this["OnDestroy"])
        {
            this["OnDestroy"](opt);
        }

        // Automatically destroy any gl variables
        if (this["DestroyGL"])
        {
            this["DestroyGL"]();
        }

        // Clear all children?
        this.Clear({ ...opt, skipEvents: true });

        if (!opt || !opt.skipEvents)
        {
            this.EmitEvent("destroyed", this, opt);
        }

        // Clear all events
        this.ClearEvent("*");
    }

    /**
     * Clears an object
     * @param opt
     */
    Clear(opt={})
    {
        if (!opt.controller)
        {
            opt.controller = this;
        }

        if (!opt || !opt.skipEvents)
        {
            this.EmitEvent("clear", this, opt);
        }

        // Custom clear function
        if (this["OnClear"])
        {
            this["OnClear"](opt);
        }

        let updated = false;

        // Clear all structs
        // TODO: Handle children that are shared
        this.PerChild((struct, parent, property, array) =>
        {
            if (struct.Destroy)
            {
                struct.Destroy(opt);
            }

            if (!array)
            {
                Reflect.deleteProperty(parent, property);
            }
            else
            {
                array.splice(array.indexOf(struct), 1);
            }

            updated = true;
        });

        if (!opt || !opt.skipEvents)
        {
            this.EmitEvent("cleared", this, opt);
        }

        if (updated && !opt || !opt.skipUpdate)
        {
            this.UpdateValues(opt);
        }
    }

    UpdateValues(opt = {})
    {
        const { skipEvents } = opt;

        if (!skipEvents)
        {
            this.EmitEvent("modify", this, opt);
        }

        if (this.OnValueChanged)
        {
            this.OnValueChanged(opt);
        }

        if (!skipEvents)
        {
            this.EmitEvent("modified", this, opt);
        }
    }

    OnModified(listener, context, once)
    {
        this.OnEvent("modified", listener, context, once);
    }

    OffModified(listener)
    {
        this.OffEvent("modified", listener);
    }

    PerChild(func, includeEmpty)
    {
        return this.constructor.schema.PerChild(this, func, includeEmpty);
    }

    FindID(id)
    {
        return this.Traverse(child => child.__id === id ? child : undefined);
    }

    /**
     * Traverses an object and it's children
     * @param func
     * @param {Object} [cache={}]
     * @param {Set} [visited]
     * @return {*}
     */
    Traverse(func, cache = { path: "root" }, visited = new Set())
    {
        // Check self
        if (visited.has(this)) return;
        const rv = func(this, cache);
        if (rv !== undefined) return rv;
        visited.add(this);

        // Check children
        return this.PerChild((child, parent, property, array) =>
        {
            let path = array ? `${cache.path}/${property}/${array.indexOf(child)}` : `${cache.path}/${property}`;

            if (child.Traverse)
            {
                return child.Traverse(func, { parent, property, array, path }, visited);
            }

            visited.add(child);
            return func(child, { parent, property, array, path, noTraverse: true });
        });
    }


    /**
     * Copies another object of the same type
     * @param a
     * @param opt
     * @return {*}
     */
    Copy(a, opt)
    {
        return this.constructor.copy(this, a, opt);
    }

    /**
     * Clones the object
     * @param opt
     * @return {*}
     */
    Clone(opt)
    {
        return this.constructor.clone(this, opt);
    }

    /**
     * Sets the object's values from a plain object
     * @param values
     * @param opt
     * @return {*}
     */
    SetValues(values, opt)
    {
        return this.constructor.set(this, values, opt);
    }

    /**
     * Gets the object's values as a plain object
     * @param opt
     * @return {*}
     */
    GetValues(opt)
    {
        return this.constructor.get(this, opt);
    }

    /**
     * Gets the classes schema
     * @return {*}
     */
    static get schema()
    {
        return Schema.get(this);
    }

    /**
     * 
     * @param a
     * @param b
     * @param opt
     * @return {*}
     */
    static copy(a, b, opt)
    {
        return this.schema.Copy(a, b, opt);
    }

    static clone(a, opt)
    {
        return this.schema.Clone(a, opt);
    }

    static set(a, values, opt)
    {
        return this.schema.SetValues(a, values, opt);
    }

    static get(a, opt)
    {
        return this.schema.GetValues(a, opt);
    }

    static from(values, opt)
    {
        return this.schema.From(values, opt);
    }

}
