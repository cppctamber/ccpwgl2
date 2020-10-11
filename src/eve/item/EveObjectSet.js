/* eslint no-unused-vars:0 */
import { meta, vec3, vec4, mat4 } from "global";


export class EveObjectSetItem extends meta.Model
{

    @meta.boolean
    display = true;

    _dirty = true;

    /**
     * Fire on value changes
     */
    OnValueChanged()
    {
        this._dirty = true;
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


    /**
     * Initializes the set
     */
    Initialize()
    {
        this.Rebuild();
    }

    /**
     * Fires on value changes
     */
    OnValueChanged()
    {
        this._dirty = true;
    }

    /**
     * Fires when an item is modified
     * @param {*} item
     * @param {*} opt
     */
    OnItemModified(item, opt)
    {
        if (this.items.includes(item))
        {
            this._dirty = true;
            this.EmitEvent("item_modified", item, opt);
        }
        else
        {
            this.EmitEvent("item_removed", item, opt);
            item.OffEvent("modified", this.OnItemModified);
        }
    }

    /**
     * Creates an item from an options object and then adds it to the set
     * @param {*} [values={}]
     * @param {Boolean} [skipUpdate]
     * @param {Boolean} [skipEvents]
     * @returns {*}
     */
    CreateItem(values = {}, skipUpdate, skipEvents)
    {
        const item = this.constructor.Item.from(values);

        this.AddItem(item, true, true);

        if (!skipEvents)
        {
            this.EmitEvent("item_created", item);
        }

        if (!skipUpdate)
        {
            this.UpdateValues();
        }

        return item;
    }

    /**
     * Adds a set item
     * @param {*} item
     * @param {Boolean} [skipUpdate]
     * @param {Boolean} [skipEvents]
     */
    AddItem(item, skipUpdate, skipEvents)
    {
        if (!this.items.includes(item))
        {
            this.items.push(item);
            this._dirty = true;

            item.OnEvent("modified", this.OnItemModified, this);

            if (!skipEvents)
            {
                this.EmitEvent("item_added", item);
            }

            if (!skipUpdate)
            {
                this.UpdateValues(item);
            }

            return true;
        }
        return false;
    }

    /**
     * Removes a set item
     * @param {*} item
     * @param {Boolean} [skipUpdate]
     * @param {Boolean} [skipEvents]
     */
    RemoveItem(item, skipUpdate, skipEvents)
    {
        const index = this.items.indexOf(item);
        if (index !== -1)
        {
            this.items.splice(index, 1);
            this._dirty = true;

            item.OffEvent("modified", this.OnItemModified);

            if (!skipEvents)
            {
                this.EmitEvent("item_removed", item);
            }

            if (!skipUpdate)
            {
                this.UpdateValues(item);
            }

            return true;
        }
        return false;
    }

    /**
     * Clears all items
     * @param {Boolean} [skipUpdate]
     * @param {Boolean} [skipEvents]
     */
    ClearItems(skipUpdate, skipEvents)
    {
        let items;
        if (!skipEvents)
        {
            items = Array.from(this.items);
        }

        for (let i = 0; i < this.items.length; i++)
        {
            this.RemoveItem(this.items[i], true, true);
            i--;
        }

        if (!skipEvents)
        {
            this.EmitEvent("items_cleared", items);
        }

        if (!skipUpdate)
        {
            this.UpdateValues();
        }
    }

    /**
     * Rebuilds items
     */
    RebuildItems()
    {
        this._visibleItems.splice(0);
        for (let i = 0; i < this.items.length; i++)
        {
            const item = this.items[i];

            if (!item.HasEvent("modified", this.OnItemModified))
            {
                this.EmitEvent("item_added", item);
                item.OnEvent("modified", this.OnItemModified, this);
            }

            if (item.display)
            {
                this._visibleItems.push(item);
            }

            if (item._dirty)
            {
                this.EmitEvent("item_rebuilt", item);
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
     * Per frame update
     * @param {Number} dt
     */
    Update(dt)
    {
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
     */
    Unload(skipEvent)
    {
        if (!skipEvent)
        {
            this.EmitEvent("unloaded");
        }
    }

    /**
     * Rebuilds the set
     */
    Rebuild()
    {
        this.EmitEvent("rebuilt");
    }

    /**
     * Gets render batches
     * @param {Number} mode
     * @param {Tw2BatchAccumulator} accumulator
     * @param {Tw2PerObjectData} perObjectData
     */
    @meta.abstract
    GetBatches(mode, accumulator, perObjectData)
    {

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
