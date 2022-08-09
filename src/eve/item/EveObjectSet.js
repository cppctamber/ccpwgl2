/* eslint no-unused-vars:0 */
import { meta } from "utils";
import { vec3, vec4, mat4, sph3, box3 } from "math";


export class EveObjectSetItem extends meta.Model
{

    @meta.boolean
    display = true;

    _dirty = true;
    _boundsDirty = true;

    /**
     * Fire on value changes
     */
    OnValueChanged()
    {
        this._dirty = true;
        this._boundsDirty = true;
    }

}


export class EveObjectSet extends meta.Model
{

    @meta.boolean
    autoRebuild = true;

    @meta.boolean
    display = true;

    @meta.list()
    items = [];

    _dirty = true;
    _visibleItems = [];
    _boundsDirty = true;
    _boundingBox = null;
    _boundingSphere = null;

    /**
     * Initializes the set
     */
    Initialize()
    {
        this.Rebuild();
    }

    /**
     * Rebuilds the item's bounds
     * @param {Boolean} [force]
     * @return {boolean}
     */
    RebuildBounds(force)
    {
        if (!this._boundingBox)
        {
            this._boundingBox = box3.create();
            this._boundingSphere = sph3.create();
            this._boundsDirty = true;
        }

        if (!force || !this._boundsDirty)
        {
            this._boundsDirty = this.AreItemBoundsDirty();
        }

        if (force || this._boundsDirty)
        {
            box3.empty(this._boundingBox);
            sph3.empty(this._boundingSphere);
            this.OnRebuildBounds();
        }

        return false;
    }

    /**
     * Fires when bounds need to be rebuilt
     */
    OnRebuildBounds()
    {
        // Temporarily stop bounds from being rebuilt by the parent
        this._boundsDirty = false;
    }

    /**
     * Gets the set's bounding box
     * @param {box3} out
     * @param {Boolean} [force]
     * @returns {null|box3}
     */
    GetBoundingBox(out, force)
    {
        this.RebuildBounds(force);
        box3.copy(this._boundingBox, this._boundingBox);
        return this._boundsDirty ? null : out;
    }

    /**
     * Gets the set's bounding sphere
     * @param {sph3} out
     * @param {Boolean} [force]
     * @return {null|sph3}
     */
    GetBoundingSphere(out, force)
    {
        this.RebuildBounds(force);
        sph3.copy(this._boundingSphere, this._boundingSphere);
        return this._boundsDirty ? null : out;
    }

    /**
     * Fires on value changes
     */
    OnValueChanged()
    {
        this._dirty = true;
        this._boundsDirty = true;
    }

    /**
     * Fires when an item is modified
     * @param {*} item
     * @param {Object} [opt]
     */
    OnItemModified(item, opt)
    {
        const skipEvents = opt && opt.skipEvents;

        if (this.items.includes(item))
        {
            this._dirty = true;
            if (!skipEvents) this.EmitEvent("item_modified", item, opt);
        }
        else
        {
            if (!skipEvents) this.EmitEvent("item_removed", item, opt);
            item.OffEvent("modified", this.OnItemModified);
        }

        this._boundsDirty = true;
    }

    /**
     * Creates an item from an options object and then adds it to the set
     * @param {*} [values={}]
     * @param {Object} [opt]
     * @returns {*}
     */
    CreateItem(values = {}, opt)
    {
        const item = this.constructor.Item.from(values);
        this.items.push(item);
        this._dirty = true;
        this._boundsDirty = true;
        item.OnEvent("modified", this.OnItemModified, this);
        if (!opt || !opt.skipEvents) this.EmitEvent("item_created", item, opt);
        if (!opt || !opt.skipUpdate) this.UpdateValues(opt);
        return item;
    }

    /**
     * Adds a set item
     * @param {*} item
     * @param {Object} [opt]
     */
    AddItem(item, opt)
    {
        if (!this.items.includes(item))
        {
            this.items.push(item);
            this._dirty = true;
            this._boundsDirty = true;
            item.OnEvent("modified", this.OnItemModified, this);
            if (!opt || !opt.skipEvents) this.EmitEvent("item_added", item, opt);
            if (!opt || !opt.skipUpdate) this.UpdateValues(opt);
            return true;
        }
        return false;
    }

    /**
     * Removes a set item
     * @param {*} item
     * @param {object} [opt]
     * @returns Boolean
     */
    RemoveItem(item, opt)
    {
        const index = this.items.indexOf(item);
        if (index !== -1)
        {
            this.items.splice(index, 1);
            this._dirty = true;
            this._boundsDirty = true;
            item.OffEvent("modified", this.OnItemModified);
            if (!opt || !opt.skipEvents) this.EmitEvent("item_removed", item, opt);
            if (!opt || !opt.skipUpdate) this.UpdateValues(opt);
            return true;
        }
        return false;
    }

    /**
     * Clears all items
     * @param {Object} [opt]
     * @returns Boolean
     */
    ClearItems(opt)
    {
        if (!this.items.length) return false;

        let items;

        const skipEvents = opt && opt.skipEvents;
        if (!skipEvents) items = Array.from(this.items);

        for (let i = 0; i < this.items.length; i++)
        {
            this.RemoveItem(this.items[i], { skipEvents: true, skipUpdate: true });
            i--;
        }

        if (!skipEvents)
        {
            this.EmitEvent("items_cleared", items, opt);
        }

        if (!opt || !opt.skipUpdate)
        {
            this.UpdateValues(opt);
        }

        return true;
    }

    /**
     * Rebuilds items
     * @param  {Object} [opt]
     */
    RebuildItems(opt)
    {
        this._visibleItems.splice(0);

        if (!this.display)
        {
            this._dirty = true;
            return;
        }

        for (let i = 0; i < this.items.length; i++)
        {
            const
                item = this.items[i],
                skipEvents = opt && opt.skipEvents;

            if (!item.HasEvent("modified", this.OnItemModified))
            {
                if (!skipEvents) this.EmitEvent("item_added", item,  opt);
                item.OnEvent("modified", this.OnItemModified, this);
            }

            if (item.display)
            {
                this._visibleItems.push(item);
            }

            if (item._dirty && !skipEvents)
            {
                this.EmitEvent("item_rebuilt", item, opt);
            }

            item._dirty = false;
        }

        this._dirty = true;
    }

    /**
     * Checks if any children are dirty
     * @returns {boolean}
     */
    AreItemsDirty()
    {
        for (let i = 0; i < this.items.length; i++)
        {
            if (this.items[i]._dirty)
            {
                return true;
            }
        }
        return false;
    }

    /**
     * Checks if any child bounds are dirty
     * @return {boolean}
     */
    AreItemBoundsDirty()
    {
        for (let i = 0; i < this.items.length; i++)
        {
            if (this.items[i]._boundsDirty)
            {
                return true;
            }
        }
        return false;
    }

    /**
     * Per frame update
     * @param {Number} dt
     */
    Update(dt)
    {
        if (!this.display) return;

        if (!this._dirty && this.autoRebuild && this.AreItemsDirty())
        {
            this._dirty = true;
        }

        if (this._dirty)
        {
            this.Rebuild();
        }
    }

    /**
     * Unloads the set's buffers
     * @param  {Object} [opt]
     */
    Unload(opt)
    {
        if (!opt || !opt.skipEvents)
        {
            this.EmitEvent("unloaded", this, opt);
        }
    }

    /**
     * Rebuilds the set
     * @param {Object} [opt]
     */
    Rebuild(opt)
    {
        if (!opt || !opt.skipEvents)
        {
            this.EmitEvent("rebuilt", this, opt);
        }
    }

    /**
     * Gets render batches
     * @param {Number} mode
     * @param {Tw2BatchAccumulator} accumulator
     * @param {Tw2PerObjectData} perObjectData
     * @returns {Boolean} true if batches accumulated
     */
    @meta.abstract
    GetBatches(mode, accumulator, perObjectData)
    {
        return false;
    }

    /**
     * Renders the set
     */
    @meta.abstract
    Render()
    {

    }

    /**
     * The object set's item
     * @type {?Function}
     */
    static Item = null;

    /**
     * Global and scratch variables
     * @type {*}
     */
    static global = {
        vec3_0: vec3.create(),
        vec3_1: vec3.create(),
        vec3_2: vec3.create(),
        vec4_0: vec4.create(),
        vec4_1: vec4.create(),
        mat4_0: mat4.create()
    };

}
