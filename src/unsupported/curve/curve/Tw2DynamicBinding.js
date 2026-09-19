import { meta } from "utils";
import { Tw2ValueBinding } from "curve";


// Pretty sure this just traverses the path, and then returns a normal binding.

@meta.define("Tr2DynamicBinding", true)
export class Tr2DynamicBinding extends meta.Model
{

    @meta.string
    name = "";

    @meta.string
    destinationObjectPath = "";

    @meta.string
    destinationObjectAttribute = "";

    @meta.notOwned
    @meta.struct()
    destination = null;

    @meta.string
    sourceObjectPath = "";

    @meta.string
    sourceObjectAttribute = "";

    @meta.notOwned
    @meta.struct()
    source = null;

    @meta.float
    scale = 1;

    @meta.int32
    bindingDelay = 0;

    @meta.notOwned
    @meta.struct()
    binding = null;

    _bindingTime = 0;
    _owner = null;

    destinationAttribute = "";
    destinationPath = null;
    sourceAttribute = "";
    sourceObject = null;

    /**
     * Initializes the binding
     * @param {*} owner
     */
    Initialize(owner)
    {
        if (owner) this.SetOwner(owner);
        return true;
    }

    OnModified()
    {
        if (this._owner)
        {
            this.Link();
        }
        else
        {
            this.Unlink();
        }
        return true;
    }

    OnSimClockRebase(oldTime, newTime)
    {
        this._bindingTime += newTime - oldTime;
    }

    IsSourceValid()
    {
        return !!this.source;
    }

    IsDestinationValid()
    {
        return !!this.destination;
    }

    Update()
    {
        if (this.binding && typeof this.binding.CopyValue === "function")
        {
            this.binding.CopyValue();
            this.ApplyCompatibilityCopy();
        }
    }

    Link()
    {
        const roots = this._owner && this._owner.GetParameterMap ? this._owner.GetParameterMap() : null;

        this.source = this.sourceObject || this.constructor.ResolvePath(roots, this.sourceObjectPath);
        this.destination = this.destination || this.constructor.ResolvePath(roots, this.destinationObjectPath);

        if (!this.source || !this.destination || !this.sourceObjectAttribute || !this.destinationObjectAttribute)
        {
            this.binding = null;
            return false;
        }

        const binding = this.binding || new Tw2ValueBinding();
        binding.name = this.name;
        binding.sourceObject = this.source;
        binding.sourceAttribute = this.sourceObjectAttribute;
        binding.destinationObject = this.destination;
        binding.destinationAttribute = this.destinationObjectAttribute;
        binding.scale = this.scale;
        binding.OnValueChanged();
        this.binding = binding;
        this.ApplyCompatibilityCopy();
        return !!binding._copyFunc;
    }

    Unlink()
    {
        this.binding = null;
        this.source = null;
        this.destination = null;
        this._bindingTime = 0;
    }

    SetOwner(owner)
    {
        this._owner = owner || null;
    }

    ApplyCompatibilityCopy()
    {
        if (this.destinationObjectPath !== "playerShip.boosters" ||
            this.destinationObjectAttribute !== "alwaysOnIntensity" ||
            !this.source ||
            !this.sourceObjectAttribute ||
            !this._owner?.GetParameterMap)
        {
            return;
        }

        const roots = this._owner.GetParameterMap();
        const ship = this.constructor.ResolvePath(roots, "playerShip");
        if (!ship || !("boosterGain" in ship)) return;

        const value = this.source[this.sourceObjectAttribute];
        if (value === undefined) return;
        ship.boosterGain = Number.isFinite(value) ? value * this.scale : value;
    }

    /**
     * Resolves Carbon dynamic-binding paths such as
     * `playerShip.controllers["shipStandard"].variables["IsWarping"]`.
     * @param {Object|Map} roots
     * @param {String} path
     * @returns {*}
     */
    static ResolvePath(roots, path)
    {
        if (!roots || !path) return null;

        const parts = this.SplitPath(path);
        let object = this.GetRoot(roots, parts.shift());

        for (let i = 0; object && i < parts.length; i++)
        {
            object = this.ResolvePart(object, parts[i]);
        }

        return object || null;
    }

    /**
     * @param {Object|Map} roots
     * @param {String} name
     * @returns {*}
     */
    static GetRoot(roots, name)
    {
        if (!name) return null;
        if (roots instanceof Map) return roots.get(name) || null;
        return roots[name] || null;
    }

    /**
     * Splits a dotted path without splitting inside bracket selectors.
     * @param {String} path
     * @returns {String[]}
     */
    static SplitPath(path)
    {
        const parts = [];
        let current = "", depth = 0;

        for (let i = 0; i < path.length; i++)
        {
            const c = path[i];
            if (c === "[") depth++;
            else if (c === "]") depth--;

            if (c === "." && depth === 0)
            {
                if (current) parts.push(current);
                current = "";
            }
            else
            {
                current += c;
            }
        }

        if (current) parts.push(current);
        return parts;
    }

    /**
     * @param {*} object
     * @param {String} part
     * @returns {*}
     */
    static ResolvePart(object, part)
    {
        const match = /^([^[]+)(?:\["([^"]+)"])?$/.exec(part);
        if (!match) return null;

        let key = match[1];
        const name = match[2];

        // ccpwgl's SOF path stores Carbon's modelRotationCurve as rotationCurve.
        if (!(key in object) && key === "modelRotationCurve" && "rotationCurve" in object)
        {
            key = "rotationCurve";
        }

        let value = object[key];
        if (name === undefined) return value || null;

        if (Array.isArray(value))
        {
            return value.find(item => item && (item.name === name || item.GetName && item.GetName() === name)) || null;
        }

        return value && value[name] || null;
    }

}
