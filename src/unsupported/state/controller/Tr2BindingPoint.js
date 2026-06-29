import { meta } from "utils";


const SWIZZLE_OFFSETS = {
    x: 0,
    r: 0,
    y: 1,
    g: 1,
    z: 2,
    b: 2,
    w: 3,
    a: 3
};

function IsObject(value)
{
    return value !== null && typeof value === "object";
}

function NormalizeRoots(roots)
{
    if (Array.isArray(roots))
    {
        return roots;
    }

    if (IsObject(roots))
    {
        const out = [];
        for (const name of Object.keys(roots))
        {
            out.push([ name, roots[name] ]);
        }
        return out;
    }

    return [];
}

function GetNamedRoots(controller, owner)
{
    const roots = [];

    if (owner)
    {
        roots.push([ "owner", owner ]);
        roots.push([ "self", owner ]);
    }

    if (controller)
    {
        roots.push([ "controller", controller ]);
        if (controller.GetOwner)
        {
            const controllerOwner = controller.GetOwner();
            if (controllerOwner) roots.push([ "owner", controllerOwner ]);
        }

        if (controller.GetBindingPathRoots)
        {
            roots.push(...NormalizeRoots(controller.GetBindingPathRoots(owner)));
        }
        else if (controller.GetBindingRoots)
        {
            roots.push(...NormalizeRoots(controller.GetBindingRoots(owner)));
        }
    }

    if (owner && owner.GetBindingRoots)
    {
        roots.push(...NormalizeRoots(owner.GetBindingRoots(controller)));
    }

    return roots;
}

function GetLinkRoots(controllerOrRoots, owner)
{
    if (Array.isArray(controllerOrRoots))
    {
        return NormalizeRoots(controllerOrRoots);
    }

    if (IsObject(controllerOrRoots) && !owner && !controllerOrRoots.GetOwner && !controllerOrRoots.GetBindingRoots && !controllerOrRoots.GetBindingPathRoots)
    {
        return NormalizeRoots(controllerOrRoots);
    }

    return GetNamedRoots(controllerOrRoots, owner);
}

function ReadIdentifier(path, index)
{
    const match = /^[A-Za-z_][A-Za-z0-9_]*/.exec(path.slice(index));
    return match ? { value: match[0], next: index + match[0].length } : null;
}

function ReadIndex(path, index)
{
    if (path[index] !== "[") return null;

    const end = path.indexOf("]", index + 1);
    if (end === -1) return null;

    const body = path.slice(index + 1, end);
    if (/^-?\d+$/.test(body))
    {
        return { value: Number(body), next: end + 1 };
    }

    if (body.length >= 2 && body[0] === "\"" && body[body.length - 1] === "\"")
    {
        return { value: body.slice(1, -1), next: end + 1 };
    }

    return null;
}

function GetListElement(object, selector)
{
    if (!object) return null;

    if (typeof selector === "number")
    {
        const list = Array.isArray(object) ? object : object.items || object.children || null;
        if (!list || typeof list.length !== "number") return null;

        const index = selector < 0 ? list.length + selector : selector;
        return index >= 0 && index < list.length ? list[index] : null;
    }

    const list = Array.isArray(object) ? object : object.items || object.children || object.curveSets || null;
    if (!list || typeof list.length !== "number") return null;

    for (let i = 0; i < list.length; i++)
    {
        if (list[i] && list[i].name === selector)
        {
            return list[i];
        }
    }

    return null;
}

export function ResolveBindingPath(path, roots)
{
    if (!path) return null;

    const root = ReadIdentifier(path, 0);
    if (!root) return null;

    let object = null;
    for (let i = 0; i < roots.length; i++)
    {
        if (roots[i][0] === root.value)
        {
            object = roots[i][1];
            break;
        }
    }

    if (!object) return null;

    let index = root.next;
    while (index < path.length)
    {
        if (path[index] === ".")
        {
            const property = ReadIdentifier(path, index + 1);
            if (!property || !object) return null;

            object = object[property.value];
            index = property.next;
            continue;
        }

        const selector = ReadIndex(path, index);
        if (!selector) return null;

        object = GetListElement(object, selector.value);
        index = selector.next;
    }

    return object || null;
}

function ParseAttribute(attribute)
{
    const dot = attribute ? attribute.indexOf(".") : -1;
    if (dot === -1) return { name: attribute || "", offset: -1 };

    const swizzle = attribute.slice(dot + 1);
    if (swizzle.length !== 1 || SWIZZLE_OFFSETS[swizzle] === undefined)
    {
        return null;
    }

    return {
        name: attribute.slice(0, dot),
        offset: SWIZZLE_OFFSETS[swizzle]
    };
}

@meta.type("Tr2BindingPoint")
@meta.ccp.define("Tr2BindingPoint")
export class Tr2BindingPoint extends meta.Model
{
    @meta.string
    path = "";

    root = "";

    @meta.notOwned
    @meta.struct()
    object = null;

    @meta.string
    attribute = "";

    _target = null;

    _attributeName = "";

    _attributeOffset = -1;

    _isLinked = false;

    Link(controllerOrRoots, owner)
    {
        const target = this.Resolve(controllerOrRoots, owner);
        return this.SetDestination(target, this.attribute);
    }

    Unlink()
    {
        this._target = null;
        this._attributeName = "";
        this._attributeOffset = -1;
        this._isLinked = false;
    }

    IsValid()
    {
        return this._isLinked;
    }

    Resolve(controllerOrRoots, owner)
    {
        if (this.path)
        {
            return ResolveBindingPath(this.path, GetLinkRoots(controllerOrRoots, owner));
        }

        if (this.root)
        {
            return ResolveBindingPath(this.root, GetLinkRoots(controllerOrRoots, owner));
        }

        if (this.object)
        {
            return this.object;
        }

        if (owner && owner.ResolveBindingPoint)
        {
            return owner.ResolveBindingPoint(this, controllerOrRoots);
        }

        return owner || null;
    }

    SetDestination(target, attribute)
    {
        this.Unlink();

        const parsed = ParseAttribute(attribute);
        if (!target || !parsed || !parsed.name || !(parsed.name in target))
        {
            return false;
        }

        const current = target[parsed.name];
        if (parsed.offset !== -1 && (!current || typeof current.length !== "number" || parsed.offset >= current.length))
        {
            return false;
        }

        this._target = target;
        this._attributeName = parsed.name;
        this._attributeOffset = parsed.offset;
        this._isLinked = true;
        return true;
    }

    SetValue(value, controllerOrRoots, owner)
    {
        if (!this.IsValid())
        {
            this.Link(controllerOrRoots, owner);
        }

        const target = this._target;
        if (!target || !this._attributeName)
        {
            return false;
        }

        if (this._attributeOffset === -1)
        {
            const current = target[this._attributeName];
            if (ArrayBuffer.isView(current) && value && typeof value.length === "number")
            {
                current.set(value);
            }
            else if (Array.isArray(current) && value && typeof value.length === "number")
            {
                for (let i = 0; i < current.length && i < value.length; i++)
                {
                    current[i] = value[i];
                }
            }
            else if (current && typeof current.length === "number" && typeof current !== "string" && typeof value === "number")
            {
                for (let i = 0; i < current.length; i++)
                {
                    current[i] = value;
                }
            }
            else
            {
                target[this._attributeName] = value;
            }
        }
        else
        {
            target[this._attributeName][this._attributeOffset] = value;
        }

        this.NotifyValueChanged(target, value);
        return true;
    }

    GetValue(controllerOrRoots, owner, fallback = 0)
    {
        if (!this.IsValid())
        {
            this.Link(controllerOrRoots, owner);
        }

        const target = this._target;
        if (!target || !this._attributeName)
        {
            return fallback;
        }

        const value = target[this._attributeName];
        if (this._attributeOffset !== -1)
        {
            return value && value.length > this._attributeOffset ? value[this._attributeOffset] : fallback;
        }

        return value;
    }

    GetBoundObject(controllerOrRoots, owner)
    {
        if (!this.IsValid())
        {
            this.Link(controllerOrRoots, owner);
        }

        return this._target || this.object;
    }

    NotifyValueChanged(target, value)
    {
        if (target.OnValueChanged)
        {
            target.OnValueChanged(this._attributeName, value, this);
        }
        else if (target.OnModified)
        {
            target.OnModified(this._attributeName, value, this);
        }
        else if (IsObject(target) && target._dirty)
        {
            target._dirty[this._attributeName] = true;
        }
    }
}
