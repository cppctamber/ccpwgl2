import { meta } from "utils";
import { Tw2Action } from "./Tw2Action";


function GetBridge(owner)
{
    return owner && owner.GetTrcAdapter ? owner.GetTrcAdapter() : owner;
}

function Unique(values)
{
    const out = [];
    for (let i = 0; i < values.length; i++)
    {
        const value = values[i];
        if (value && !out.includes(value)) out.push(value);
    }
    return out;
}

function GetCandidates(owner)
{
    const bridge = GetBridge(owner);
    return Unique([
        bridge,
        bridge && bridge.owner,
        owner,
        owner && owner.owner
    ]);
}

function NormalizeName(name)
{
    return String(name || "").toLowerCase();
}

function GetBindingRoots(owner, controller)
{
    const roots = {};
    for (const candidate of GetCandidates(owner))
    {
        if (candidate.GetBindingRoots)
        {
            Object.assign(roots, candidate.GetBindingRoots(controller));
        }
    }
    return roots;
}

function GetRootObject(owner)
{
    for (const candidate of GetCandidates(owner))
    {
        if (candidate.GetRootObject) return candidate.GetRootObject();
        if (candidate.rootObject) return candidate.rootObject;
        if (candidate.root) return candidate.root;
    }
    return owner || null;
}

function StartControllers(owner)
{
    for (const candidate of GetCandidates(owner))
    {
        if (candidate.StartControllers)
        {
            candidate.StartControllers();
            return true;
        }
    }
    return false;
}

function SetControllerVariable(owner, name, value)
{
    for (const candidate of GetCandidates(owner))
    {
        if (candidate.SetControllerVariable)
        {
            return candidate.SetControllerVariable(name, value) !== false;
        }
    }

    for (const candidate of GetCandidates(owner))
    {
        const controllers = Array.isArray(candidate.controllers) ? candidate.controllers : [];
        let changed = false;
        for (let i = 0; i < controllers.length; i++)
        {
            if (controllers[i] && controllers[i].SetVariableValue)
            {
                changed = controllers[i].SetVariableValue(name, value) || changed;
            }
        }
        if (changed) return true;
    }
    return false;
}

function GetSourceVariableValue(controller, name, fallback)
{
    if (!controller || !name)
    {
        return fallback;
    }

    if (controller.GetFloatVariableByName)
    {
        const variable = controller.GetFloatVariableByName(name);
        if (variable !== undefined && variable !== null)
        {
            return typeof variable === "number" ? variable : variable.value;
        }
    }

    if (controller.FindVariable)
    {
        const variable = controller.FindVariable(name);
        if (variable) return variable.value;
    }

    if (controller.GetVariableValue)
    {
        return controller.GetVariableValue(name, fallback);
    }

    return fallback;
}


@meta.notImplemented
@meta.type("Tr2ActionSetExternalControllerVariable")
@meta.ccp.define("Tr2ActionSetExternalControllerVariable")
export class Tr2ActionSetExternalControllerVariable extends Tw2Action
{

    @meta.string
    destinationOwner = "";

    @meta.notOwned
    @meta.struct()
    destination = null;

    @meta.string
    sourceVariable = "";

    @meta.string
    variable = "";

    @meta.float
    value = 0;

    @meta.boolean
    startControllers = false;

    _controller = null;

    Link(controller, owner)
    {
        this._controller = controller || null;
        this.LinkToDestinationOwner(controller, owner);
    }

    Unlink()
    {
        this._controller = null;
        this.destination = null;
    }

    Start(controller, owner)
    {
        controller = controller || this._controller;
        owner = owner || (controller && controller.GetOwner ? controller.GetOwner() : null);

        if (!this.IsDestinationValid())
        {
            this.LinkToDestinationOwner(controller, owner);
        }

        if (!this.IsDestinationValid())
        {
            return;
        }

        if (this.startControllers)
        {
            StartControllers(this.destination);
        }

        const value = this.sourceVariable ?
            GetSourceVariableValue(controller, this.sourceVariable, this.value) :
            this.value;
        SetControllerVariable(this.destination, this.variable, value);
    }

    OnModified(propertyName)
    {
        if (propertyName === "destinationOwner")
        {
            this.LinkToDestinationOwner(this._controller);
        }
        return true;
    }

    IsDestinationValid()
    {
        return !!this.destination;
    }

    IsVariableValid()
    {
        return !!this.variable;
    }

    LinkToDestinationOwner(controller = this._controller, owner)
    {
        this.destination = null;
        if (!controller)
        {
            return false;
        }

        owner = owner || (controller.GetOwner ? controller.GetOwner() : null);
        if (!owner || !GetRootObject(owner))
        {
            return false;
        }

        const destinationOwner = NormalizeName(this.destinationOwner);
        const roots = GetBindingRoots(owner, controller);
        for (const key of Object.keys(roots))
        {
            if (NormalizeName(key) === destinationOwner)
            {
                this.destination = roots[key];
                return true;
            }
        }
        return false;
    }
}
