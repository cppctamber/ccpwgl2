import { tw2 } from "global";
import { meta } from "utils";
import { Tr2InteriorScene } from "interior/scene/Tr2InteriorScene";


/**
 * Runtime-character view of a Tr2InteriorScene.
 *
 * Characters and ordinary interior geometry remain separate runtime lists for
 * callers, but both are rendered by the wrapped scene's `dynamics` list.
 * Lights remain scene-owned so every character and placeable receives the
 * same per-frame interior-light selection.
 */
export class TnyCharacterScene extends meta.Model
{
    wrapped = null;

    characters = [];

    geometry = [];

    lights = [];

    constructor(wrapped = new Tr2InteriorScene(), values)
    {
        super();
        if (values) this.SetValues(values);
        this.SetWrapped(wrapped);
    }

    get isScene()
    {
        return true;
    }

    /** Sets the interior scene that owns update, lighting, and batches. */
    SetWrapped(wrapped)
    {
        if (!(wrapped instanceof Tr2InteriorScene))
        {
            throw new TypeError("TnyCharacterScene requires a Tr2InteriorScene");
        }

        this.wrapped = wrapped;
        this.Rebuild();
        return this;
    }

    /** Adds one character wrapper, or an array of wrappers, to the scene. */
    AddCharacter(character)
    {
        return this._Add("characters", character, "character");
    }

    /** Removes one character wrapper without affecting any scene sibling. */
    RemoveCharacter(character)
    {
        return this._Remove("characters", character, "character");
    }

    /**
     * Replaces one character in place so an atomic appearance handoff keeps
     * its scene identity, draw order, and scene-owned lighting slot.
     *
     * The replacement may already be attached while it is being prepared. In
     * that case its temporary entry is removed before the original slot is
     * replaced, leaving every unrelated character at the same index.
     */
    ReplaceCharacter(previous, replacement)
    {
        if (!previous || !replacement)
        {
            throw new TypeError("Invalid character-scene replacement");
        }
        if (previous === replacement) return this;

        const previousIndex = this.characters.indexOf(previous);
        if (previousIndex === -1)
        {
            throw new Error("Character-scene replacement source is not attached");
        }

        const replacementIndex = this.characters.indexOf(replacement);
        if (replacementIndex !== -1)
        {
            this.characters.splice(replacementIndex, 1);
        }

        const targetIndex = replacementIndex !== -1 && replacementIndex < previousIndex
            ? previousIndex - 1
            : previousIndex;
        this.characters[targetIndex] = replacement;
        this.Rebuild();
        this.EmitEvent("character_replaced", this, previous, replacement);
        return this;
    }

    /** Adds ordinary non-character interior geometry. */
    AddGeometry(object)
    {
        return this._Add("geometry", object, "geometry");
    }

    /** Removes ordinary non-character interior geometry. */
    RemoveGeometry(object)
    {
        return this._Remove("geometry", object, "geometry");
    }

    /** Adds one scene-owned interior light, or an array of lights. */
    AddLight(light)
    {
        return this._Add("lights", light, "light");
    }

    /** Removes one scene-owned interior light. */
    RemoveLight(light)
    {
        return this._Remove("lights", light, "light");
    }

    /** TnyClient-compatible alias for non-character scene geometry. */
    AddObject(object)
    {
        return this.AddGeometry(object);
    }

    /** TnyClient-compatible alias for non-character scene geometry. */
    RemoveObject(object)
    {
        return this.RemoveGeometry(object);
    }

    /** Appends every attached character wrapper to an output array. */
    GetCharacters(out = [])
    {
        out.push(...this.characters);
        return out;
    }

    /** Appends every ordinary geometry wrapper to an output array. */
    GetGeometry(out = [])
    {
        out.push(...this.geometry);
        return out;
    }

    /** Appends every scene-owned light to an output array. */
    GetLights(out = [])
    {
        out.push(...this.lights);
        return out;
    }

    /** Appends all characters and ordinary geometry to an output array. */
    GetObjects(out = [])
    {
        out.push(...this.characters, ...this.geometry);
        return out;
    }

    /** Detaches every character while preserving geometry and lights. */
    ClearCharacters()
    {
        return this._Clear("characters", "character");
    }

    /** Detaches every ordinary geometry object while preserving characters. */
    ClearGeometry()
    {
        return this._Clear("geometry", "geometry");
    }

    /** Removes every scene-owned light. */
    ClearLights()
    {
        return this._Clear("lights", "light");
    }

    /** Detaches every character and geometry object while preserving lights. */
    ClearObjects()
    {
        const changed = this.characters.length || this.geometry.length;
        this.characters.splice(0);
        this.geometry.splice(0);
        if (changed)
        {
            this.Rebuild();
            this.EmitEvent("objects_cleared", this);
        }
        return this;
    }

    /** Mirrors runtime wrappers into the real interior scene. */
    Rebuild()
    {
        const dynamics = this.wrapped.dynamics;
        const lights = this.wrapped.lights;

        dynamics.splice(0);
        lights.splice(0);

        for (let i = 0; i < this.characters.length; i++)
        {
            dynamics.push(this.constructor.ResolveWrapped(this.characters[i]));
        }
        for (let i = 0; i < this.geometry.length; i++)
        {
            dynamics.push(this.constructor.ResolveWrapped(this.geometry[i]));
        }
        for (let i = 0; i < this.lights.length; i++)
        {
            lights.push(this.constructor.ResolveWrapped(this.lights[i]));
        }

        this.EmitEvent("rebuilt", this);
        return this;
    }

    /** Initializes the wrapped interior scene. */
    Initialize()
    {
        this.wrapped.Initialize();
        return this;
    }

    /** Updates the wrapped scene and every attached character. */
    Update(dt)
    {
        this.wrapped.Update(dt);
        this.EmitEvent("update", this, dt);
        return true;
    }

    /**
     * Collects the wrapped interior scene into the outer TnyClient's shared
     * accumulator. The client remains responsible for render setup and entry.
     */
    Render(dt, client)
    {
        const accumulator = client?.accumulator;
        if (!accumulator?.Clear || !accumulator?.Render) return false;

        accumulator.Clear();
        this.wrapped.UpdateViewDependentData();
        this.wrapped.GetBatches(tw2.device.RM_OPAQUE, accumulator);
        this.wrapped.GetBatches(tw2.device.RM_DECAL, accumulator);
        this.wrapped.GetBatches(tw2.device.RM_TRANSPARENT, accumulator);
        this.wrapped.GetBatches(tw2.device.RM_ADDITIVE, accumulator);

        if (!accumulator.length) return false;
        accumulator.Render();
        this.EmitEvent("render", this, dt);
        return true;
    }

    /** Appends resources owned by the wrapped scene and all its contents. */
    GetResources(out = [])
    {
        return this.wrapped.GetResources(out);
    }

    _Add(property, value, eventName)
    {
        if (Array.isArray(value))
        {
            for (let i = 0; i < value.length; i++) this._Add(property, value[i], eventName);
            return this;
        }
        if (!value) throw new TypeError(`Invalid character-scene ${eventName}`);

        if (!this[property].includes(value))
        {
            this[property].push(value);
            this.Rebuild();
            this.EmitEvent(`${eventName}_added`, this, value);
        }
        return this;
    }

    _Remove(property, value, eventName)
    {
        const index = this[property].indexOf(value);
        if (index !== -1)
        {
            this[property].splice(index, 1);
            this.Rebuild();
            this.EmitEvent(`${eventName}_removed`, this, value);
        }
        return this;
    }

    _Clear(property, eventName)
    {
        if (this[property].length)
        {
            this[property].splice(0);
            this.Rebuild();
            this.EmitEvent(`${eventName}s_cleared`, this);
        }
        return this;
    }

    static ResolveWrapped(value)
    {
        return value?.wrapped || value;
    }
}
