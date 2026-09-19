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
    _currentTime = 0;
    _lastLinkSignature = "";
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
        const signature = this.GetLinkSignature();
        if (signature === this._lastLinkSignature)
        {
            return true;
        }

        if (this._owner)
        {
            this.Link();
        }
        else
        {
            this.Unlink();
            this._lastLinkSignature = signature;
        }
        return true;
    }

    OnSimClockRebase(oldTime, newTime)
    {
        const adjustment = newTime - oldTime;
        this._bindingTime += adjustment;
        this._currentTime += adjustment;
    }

    IsSourceValid()
    {
        return !!this.source;
    }

    IsDestinationValid()
    {
        return !!this.destination;
    }

    Update(dt = 0)
    {
        this._currentTime += Math.max(0, Number(dt) || 0);
        if (this.binding && this._bindingTime <= this._currentTime && typeof this.binding.CopyValue === "function")
        {
            const copied = this.binding.CopyValue();
            this.ApplyCompatibilityCopy();
            return copied;
        }
        return false;
    }

    Link()
    {
        this.Unlink();
        this._lastLinkSignature = this.GetLinkSignature();

        if (!this._owner)
        {
            return false;
        }

        const roots = this._owner && this._owner.GetParameterMap ? this._owner.GetParameterMap() : null;

        this.source = this.sourceObject || this.constructor.ResolvePath(roots, this.sourceObjectPath);
        this.destination = this.constructor.ResolvePath(roots, this.destinationObjectPath);

        if (!this.source || !this.destination || !this.sourceObjectAttribute || !this.destinationObjectAttribute)
        {
            return false;
        }

        const binding = new Tw2ValueBinding();
        binding.name = this.name;
        binding.CreateWeakBinding(
            this.source,
            this.sourceObjectAttribute,
            this.destination,
            this.destinationObjectAttribute,
            this.scale
        );
        this.binding = binding;
        this._bindingTime = this._currentTime + Math.max(0, Number(this.bindingDelay) || 0) / 1000;
        return !!this.binding._copyFunc;
    }

    Unlink()
    {
        if (this.binding)
        {
            this.binding.SetSourceObject?.(null);
            this.binding.SetDestinationObject?.(null);
        }
        this.binding = null;
        this.source = null;
        this.destination = null;
        this._bindingTime = 0;
    }

    SetOwner(owner)
    {
        this._owner = owner || null;
    }

    GetLinkSignature()
    {
        return JSON.stringify([
            this.destinationObjectPath,
            this.destinationObjectAttribute,
            this.sourceObjectPath,
            this.sourceObjectAttribute,
            this.scale
        ]);
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

        const value = String(path);
        const root = /^([A-Za-z_][A-Za-z_0-9]*)/.exec(value);
        if (!root) return null;

        let object = this.GetRoot(roots, root[1]);
        let offset = root[1].length;

        while (object && offset < value.length)
        {
            const remainder = value.slice(offset);
            const attribute = /^\.([A-Za-z_][A-Za-z_0-9]*)/.exec(remainder);
            if (attribute)
            {
                object = this.ResolveAttribute(object, attribute[1]);
                offset += attribute[0].length;
                continue;
            }

            const index = /^\[(-?[0-9]+)\]/.exec(remainder);
            if (index)
            {
                object = this.GetListElement(object, Number(index[1]));
                offset += index[0].length;
                continue;
            }

            const name = /^\["([^"]*)"\]/.exec(remainder);
            if (name)
            {
                object = this.GetListElement(object, name[1]);
                offset += name[0].length;
                continue;
            }

            return null;
        }

        return offset === value.length && this.IsReference(object) ? object : null;
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
        return Object.prototype.hasOwnProperty.call(roots, name) ? roots[name] : null;
    }

    static ResolveAttribute(object, key)
    {
        // ccpwgl's SOF path stores Carbon's modelRotationCurve as rotationCurve.
        if (!(key in object) && key === "modelRotationCurve" && "rotationCurve" in object)
        {
            key = "rotationCurve";
        }

        return object && typeof object === "object" ? object[key] || null : null;
    }

    static GetListElement(value, selector)
    {
        const isArray = Array.isArray(value);
        const size = isArray ? value.length : Number(value?.GetSize?.());
        const isList = Number.isInteger(size) && size >= 0;

        if (isList)
        {
            const at = index => isArray ? value[index] : value.GetAt(index);
            if (typeof selector === "number")
            {
                const index = selector < 0 ? selector + size : selector;
                return index >= 0 && index < size ? at(index) || null : null;
            }

            for (let i = 0; i < size; i++)
            {
                const item = at(i);
                if (item && (item.name === selector || item.GetName && item.GetName() === selector))
                {
                    return item;
                }
            }
            return null;
        }

        return typeof selector === "string" && value && typeof value === "object" ? value[selector] || null : null;
    }

    static IsReference(value)
    {
        return value !== null && (typeof value === "object" || typeof value === "function");
    }

}
