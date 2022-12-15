/* eslint no-unused-vars:0 */
import { meta } from "utils";
import { vec3, vec4, mat4, sph3, box3 } from "math";


export class EveObjectSetItem extends meta.Model
{

    @meta.boolean
    display = true;

    /**
     * Marks the item as dirty
     * @type {boolean}
     */
    _dirty = true;

    /**
     * The item's parent object
     * @type {null|EveObjectSet}
     */
    _parent = null;

    /**
     * Checks if the item is skinned
     * @returns {boolean}
     */
    get isSkinned()
    {
        return false;
    }

    /**
     * Checks if the item is dirty
     * @returns {boolean}
     */
    get isDirty()
    {
        return this._dirty;
    }

    /**
     * Fires when rebuild by the parent object
     * @param {EveObjectSet} parent
     */
    OnRebuiltByParent(parent)
    {
        this._parent = parent;
        this._dirty = false;
    }

    /**
     * Fires on value changes
     */
    OnValueChanged(opt)
    {
        this._dirty = true;
        if (this._parent)
        {
            this._parent.OnItemModified(this, opt);
        }
    }

    /**
     * Fires when the item is destroyed
     */
    OnDestroy()
    {
        this._bone = null;
        this._parent = null;
    }

    /**
     * Gets the object's local transform
     * @param {mat4} out
     * @return {mat4} out
     */
    @meta.abstract
    GetTransform(out)
    {

    }

    /**
     * Gets the object's world transform
     * @param {mat4} out
     */
    GetWorldTransform(out)
    {
        if (!this._parent)
        {
            mat4.identity(out);
            throw new Error("Parent not defined");
        }

        this.GetTransform(out);
        return mat4.multiply(out, this._parent.GetParentTransformReference(), out);
    }

    /**
     * Gets the item's bounding box
     * @param {box3} out
     * @returns {box3} out
     */
    @meta.abstract
    GetBoundingBox(out)
    {

    }

    /**
     * Gets the item's bounding sphere
     * @param {sph3} out
     * @returns {sph3} out
     */
    GetBoundingSphere(out)
    {
        return sph3.fromBox3(out, this.GetBoundingBox(EveObjectSet.global.box3_0));
    }

    /**
     * Gets the item's world bounding box
     * @param {box3} out
     * @returns {box3} out
     */
    GetWorldBoundingBox(out)
    {
        if (!this._parent)
        {
            box3.empty(out);
            throw new Error("Parent not defined");
        }

        this.GetBoundingBox(out);
        return box3.transformMat4(out, out, this._parent.GetParentTransformReference());
    }

    /**
     * Gets the item's world bounding box
     * @param {box3} out
     * @returns {box3} out
     */
    GetWorldBoundingSphere(out)
    {
        if (!this._parent)
        {
            sph3.empty(out);
            throw new Error("Parent not defined");
        }

        this.GetBoundingSphere(out);
        return sph3.transformMat4(out, out, this._parent.GetParentTransformReference());
    }

}


export class EveObjectSet extends meta.Model
{

    @meta.boolean
    display = true;

    @meta.list()
    items = [];

    _dirty = true;
    _visibleItems = [];

    _boundsDirty = true;
    _boundingBox = null;
    _boundingSphere = null;

    _bones = null;
    _parentTransform = mat4.create();

    /*
    get isDirty()
    {
        return this._dirty || this.AreItemsDirty();
    }
     */

    /**
     * Initializes the set
     */
    Initialize()
    {
        this.Rebuild();
    }

    /**
     * Gets a reference to the parent transform
     * @returns {mat4}
     */
    GetParentTransformReference()
    {
        return this._parentTransform;
    }

    /**
     * Gets a bone by its reference
     * @param {Number} [boneIndex]
     * @returns {mat4|null}
     */
    GetBone(boneIndex)
    {
        if (this._bones && this._bones[boneIndex])
        {
            return this._bones[boneIndex];
        }
        return null;
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
        
        if (force || this.AreBoundsDirty())
        {
            this.OnRebuildBounds();
            return true;
        }

        return false;
    }

    /**
     * Fires when bounds need to be rebuilt
     * - Calculates bounding box and converts to a sphere
     */
    OnRebuildBounds()
    {
        box3.empty(this._boundingBox);
        sph3.empty(this._boundingSphere);

        if (!this._visibleItems.length)
        {
            this._boundsDirty = false;
            return;
        }

        const { box3_0 } = EveObjectSet.global;
        for (let i = 0; i < this._visibleItems.length; i++)
        {
            this._visibleItems[i].GetBoundingBox(box3_0);
            box3.union(this._boundingBox, this._boundingBox, box3_0);
        }

        sph3.fromBox3(this._boundingSphere, this._boundingBox);
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
        box3.copy(out, this._boundingBox);
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
        sph3.copy(out, this._boundingSphere);
        return this._boundsDirty ? null : out;
    }

    /**
     * Gets world bounding box
     * @param {box3} out
     * @param {Boolean} [force]
     * @returns {box3|null}
     */
    GetWorldBoundingBox(out, force)
    {
        return this.GetBoundingBox(out, force) ? box3.transformMat4(out, out, this._parentTransform) : null;
    }

    /**
     * Gets world bounding sphere
     * @param {sph3} out
     * @param {Boolean} [force]
     * @returns {sph3|null}
     */
    GetWorldBoundingSphere(out, force)
    {
        return this.GetBoundingSphere(out, force) ? sph3.transformMat4(out, out, this._parentTransform) : null;
    }

    /**
     * Fires on value changes
     */
    OnValueChanged()
    {
        this._dirty = true;
    }

    /**
     * Fires when the item is destroyed
     */
    OnDestroy()
    {
        this._bones = null;
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
            if (!skipEvents) this.EmitEvent("item_modified", item, opt);
        }
        
        this._dirty = true;
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
        item.OnRebuiltByParent(this);

        this._dirty = true;
        this._boundsDirty = true;

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
            item.OnRebuiltByParent(this);

            this._dirty = true;
            this._boundsDirty = true;

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
            item.OnRebuiltByParent(null);

            this._dirty = true;
            this._boundsDirty = true;

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
     * @param {Object} [opt]
     */
    RebuildItems(opt)
    {
        this._visibleItems.splice(0);

        if (!this.display)
        {
            this._dirty = true;
            this._boundsDirty = true;
            return;
        }

        for (let i = 0; i < this.items.length; i++)
        {
            const
                item = this.items[i],
                skipEvents = opt && opt.skipEvents;

            if (item.display)
            {
                this._visibleItems.push(item);
            }

            if (item.isDirty)
            {
                if (!skipEvents)
                {
                    this.EmitEvent("item_rebuilt", item, opt);
                }
            }

            item.OnRebuiltByParent(this);
        }

        this._dirty = true;
        this._boundsDirty = true;
    }

    /**
     * Checks if any children are dirty
     * @returns {boolean}
     */
    AreItemsDirty()
    {
        for (let i = 0; i < this.items.length; i++)
        {
            if (this.items[i].isDirty) return true;
        }
        return false;
    }

    /**
     * Check if any children have dirty bounds
     * @returns {boolean}
     */
    AreBoundsDirty()
    {
        if (this._boundsDirty) return true;

        for (let i = 0; i < this._visibleItems.length; i++)
        {
            if (this._visibleItems[i].isSkinned)
            {
                return true;
            }
        }
        return false;
    }

    /**
     * Per frame update
     * @param {mat4} parentTransform
     * @param {Array<Tw2Bone>} bones
     */
    UpdateViewDependentData(parentTransform, bones)
    {
        if (!this.display) return;

        if (this._bones !== bones)
        {
            this._bones = bones;
            this._dirty = true;
            this._boundsDirty = true;
        }

        mat4.copy(this._parentTransform, parentTransform);
    }

    /**
     * Per frame update
     * @param {Number} dt
     */
    Update(dt)
    {
        if (!this.display) return;
        if (this._dirty) this.Rebuild();
    }

    /**
     * Unloads the set's buffers
     * @param  {Object} [opt]
     */
    Unload(opt)
    {
        if (!opt || !opt.skipEvents) this.EmitEvent("unloaded", this, opt);
        // this._dirty = true;
    }

    /**
     * Rebuilds the set
     * @param {Object} [opt]
     */
    Rebuild(opt)
    {
        this._dirty = false;
        if (!opt || !opt.skipEvents) this.EmitEvent("rebuilt", this, opt);
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
        mat4_0: mat4.create(),
        box3_0: box3.create(),
        sph3_0: sph3.create()
    };

}
