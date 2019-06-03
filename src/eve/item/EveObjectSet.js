/* eslint no-unused-vars:0 */
import {vec3, vec4, mat4, util} from "../../global";
import {Tw2BaseClass} from "../../global";
import {ErrAbstractClassMethod} from "../../core";

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
        if (this._parent)
        {
            this._parent.OnChildValueChanged(this);
        }
    }

    /**
     * Fires when the object is destroyed
     */
    OnDestroyed()
    {
        if (this._parent)
        {
            this._parent.RemoveItem(this);
        }
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
 */
export class EveObjectSet extends Tw2BaseClass
{
    // ccpwgl
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
     * Fires on child value changes
     * @param {*} child
     */
    OnChildValueChanged(child)
    {
        this.emit("child_modified", {child});
        this._dirty = true;
        //this.UpdateValues(child);
    }

    /**
     * Creates an item from an options object and then adds it to the set
     * @param {*} {values}
     * @param {*} [opt={}]
     * @returns {*}
     */
    CreateItem(values = {}, opt)
    {
        const item = this.constructor.Item.from(values, opt);
        this.AddItem(item, opt ? opt.skipUpdate : false);
        return item;
    }

    /**
     * Adds a set item
     * @param {*} item
     * @param {Boolean} [skipUpdate]
     */
    AddItem(item, skipUpdate)
    {
        if (!this.items.includes(item))
        {
            this.emit("child_added", {ctx: item});
            //item.SetParent(this);
            this.items.push(item);
            this._dirty = true;
            if (!skipUpdate) this.UpdateValues(item);
            return true;
        }
        return false;
    }

    /**
     * Removes a set item
     * @param {*} item
     * @param {Boolean} [skipUpdate]
     */
    RemoveItem(item, skipUpdate)
    {
        const index = this.items.indexOf(item);
        if (index !== -1)
        {
            this.emit("child_removed", {ctx: item});
            //item.UnsetParent(this);
            this.items.splice(index, 1);
            this._dirty = true;
            if (!skipUpdate) this.UpdateValues(item);
            return true;
        }
        return false;
    }

    /**
     * Clears all items
     * @param {Boolean} [skipUpdate]
     */
    ClearItems(skipUpdate)
    {
        for (let i = 0; i < this.items.length; i++)
        {
            this.RemoveItem(this.items[i], true);
            i--;
        }
        if (!skipUpdate) this.UpdateValues();
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
            //item.SetParent(this);

            if (item.display)
            {
                this._visibleItems.push(item);
            }

            item._dirty = false;
        }
        this._dirty = true;
    }

    /**
     * Per frame update
     * @param {Number} dt
     * @param {mat4} parentMatrix
     */
    Update(dt, parentMatrix)
    {
        if (this._dirty)
        {
            this.Rebuild();
        }
    }

    /**
     * Unloads the set's buffers
     */
    Unload()
    {
        throw new ErrAbstractClassMethod();
    }

    /**
     * Rebuilds the set
     */
    Rebuild()
    {
        throw new ErrAbstractClassMethod();
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