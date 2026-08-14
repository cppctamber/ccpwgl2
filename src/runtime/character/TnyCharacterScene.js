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

    AddCharacter(character)
    {
        return this._Add("characters", character, "character");
    }

    RemoveCharacter(character)
    {
        return this._Remove("characters", character, "character");
    }

    AddGeometry(object)
    {
        return this._Add("geometry", object, "geometry");
    }

    RemoveGeometry(object)
    {
        return this._Remove("geometry", object, "geometry");
    }

    AddLight(light)
    {
        return this._Add("lights", light, "light");
    }

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

    GetCharacters(out = [])
    {
        out.push(...this.characters);
        return out;
    }

    GetGeometry(out = [])
    {
        out.push(...this.geometry);
        return out;
    }

    GetLights(out = [])
    {
        out.push(...this.lights);
        return out;
    }

    GetObjects(out = [])
    {
        out.push(...this.characters, ...this.geometry);
        return out;
    }

    ClearCharacters()
    {
        return this._Clear("characters", "character");
    }

    ClearGeometry()
    {
        return this._Clear("geometry", "geometry");
    }

    ClearLights()
    {
        return this._Clear("lights", "light");
    }

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

    Initialize()
    {
        this.wrapped.Initialize();
        return this;
    }

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
