/* eslint no-unused-vars:0 */
import { vec3, vec4, mat4, util, Tw2BaseClass } from "../../global";
import { ErrAbstractClassMethod } from "../../core";

/**
 * EveObjectSetItem base class
 * @ccp N/A
 *
 * @property {Boolean} display - Toggles the set item's visibility
 * @property {Boolean} _dirty  - Identifies that the item is dirty
 */
export class EveObjectSetItem extends Tw2BaseClass
{

    display = true;
    _dirty = true;

    /**
     * Fire on value changes
     */
    OnValueChanged()
    {
        this._dirty = true;
    }

    /**
     * Fires when the object is destroyed
     */
    OnDestroyed()
    {

    }

}

/**
 * EveObjectSet base class
 * @ccp N/A
 *
 * @property {Boolean} display        - Toggles set visibility
 * @property {Array<*>} items         - The set's items
 * @property {Array<*>} _visibleItems - The set's items that will be rendered when the set is visible
 * @property {Boolean} _dirty         - Identifies if the set requires rebuilding
 * @property {Boolean} _autoRebuild   - Auto rebuilds the object if a child is dirty
 */
export class EveObjectSet extends Tw2BaseClass
{
    // ccpwgl
    autoRebuild = true;
    display = true;
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
            this.emit("item_modified", item, opt);
        }
        else
        {
            this.emit("item_removed", item, opt);
            item.off("modified", this.OnItemModified);
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
            this.emit("item_created", item);
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

            item.on("modified", this.OnItemModified, this);

            if (!skipEvents)
            {
                this.emit("item_added", item);
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

            item.off("modified", this.OnItemModified);

            if (!skipEvents)
            {
                this.emit("item_removed", item);
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
            this.emit("items_cleared", items);
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

            if (!item.has("modified", this.OnItemModified))
            {
                this.emit("item_added", item);
                item.on("modified", this.OnItemModified, this);
            }

            if (item.display)
            {
                this._visibleItems.push(item);
            }

            if (item._dirty)
            {
                this.emit("item_rebuilt", item);
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
            this.emit("unloaded");
        }
    }

    /**
     * Rebuilds the set
     */
    Rebuild()
    {
        this.emit("rebuilt");
    }

    /**
     * Gets render batches
     * @param {Number} mode
     * @param {Tw2BatchAccumulator} accumulator
     * @param {Tw2PerObjectData} perObjectData
     */
    GetBatches(mode, accumulator, perObjectData)
    {
        throw new ErrAbstractClassMethod();
    }

    /**
     * Renders the set
     */
    Render()
    {
        throw new ErrAbstractClassMethod();
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
