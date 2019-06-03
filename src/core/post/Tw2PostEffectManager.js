import {Tw2PostEffect} from "./Tw2PostEffect";
import {Tw2BaseClass} from "../../global/class/Tw2BaseClass";

/**
 * Tw2PostEffectManager
 *
 * @property {Number|String} _id
 * @property {String} name
 * @property {Boolean} display
 * @property {Array<Tw2PostEffect>} items
 */
export class Tw2PostEffectManager extends Tw2BaseClass
{

    name = "Post manager";
    display = true;
    effects = [];

    _dirty = true;
    _onChildValueChanged = item => this.UpdateValues(item);
    _visibleEffects = [];
    
    /**
     * Fires on value changes
     */
    OnValueChanged()
    {
        this._dirty = true;
    }

    /**
     * Checks if all post effects are good
     * @returns {Boolean}
     */
    IsGood()
    {
        let IsGood = 0;
        for (let i = 0; i < this.effects.length; i++)
        {
            if (this.effects[i].IsGood())
            {
                IsGood++;
            }
        }
        return IsGood === this.effects.length;
    }

    /**
     * Keeps the post effects alive
     */
    KeepAlive()
    {
        for (let i = 0; i < this.effects.length; i++)
        {
            this.effects[i].KeepAlive();
        }
    }

    /**
     * Gets resources
     * @param {Array} [out=[]]
     * @returns {Array<Tw2Resource>} out
     */
    GetResources(out = [])
    {
        for (let i = 0; i < this.effects.length; i++)
        {
            this.effects[i].GetResources(out);
        }
        return out;
    }

    /**
     * Creates an item from an object
     * @param {*} [opt={}]
     * @returns {Tw2PostEffect}
     */
    CreateItem(opt = {})
    {
        const item = Tw2PostEffect.from(opt);
        this.AddItem(item);
        return item;
    }

    /**
     * Adds a post effect
     * @param {Tw2PostEffect} item
     */
    AddItem(item)
    {
        if (!this.effects.includes(item))
        {
            if (item.index === -1)
            {
                item.index = this.effects.length;
            }

            item._onModified = this._onChildValueChanged;
            this.effects.push(item);
            this.UpdateValues(item);
        }
    }

    /**
     * Removes a post effect
     * @param {Tw2PostEffect} item
     */
    RemoveItem(item)
    {
        const index = this.effects.indexOf(item);
        if (index !== -1)
        {
            item._onModified = null;
            this.effects.splice(index, 1);
            this.UpdateValues(item);
        }
    }

    /**
     * Clears all post effects
     */
    ClearItems()
    {
        for (let i = 0; i < this.effects.length; i++)
        {
            this.effects[i]._onModified = null;
            this.effects[i].ClearItems();
        }
        this.effects = [];
        this.UpdateValues();
    }

    /**
     * Per frame update
     * @param {Number} dt - delta time
     */
    Update(dt)
    {
        if (this._dirty)
        {
            this._visibleEffects = [];
            for (let i = 0; i < this.effects.length; i++)
            {
                if (this.effects[i].display)
                {
                    this._visibleEffects.push(this.effects[i]);
                }
            }

            this._visibleEffects.sort((a, b)=>
            {
                return a.index - b.index;
            });

            this._dirty = false;
        }

        for (let i = 0; i < this.effects.length; i++)
        {
            this.effects[i].Update(dt);
        }
    }

    /**
     * Per frame update
     * @returns {Boolean} true if post was rendered
     */
    Render()
    {
        if (!this.display)
        {
            this.KeepAlive();
            return false;
        }

        let rendered = 0;
        for (let i = 0; i < this._visibleEffects.length; i++)
        {
            if (this._visibleEffects[i].Render())
            {
                rendered++;
            }
        }
        return !!rendered;
    }

    /**
     * Child constructor
     * @type {Tw2PostEffect}
     */
    static Item = Tw2PostEffect;

}