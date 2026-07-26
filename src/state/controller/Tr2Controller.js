import { meta } from "utils";


@meta.type("Tr2Controller")
@meta.ccp.define("Tr2Controller")
export class Tr2Controller extends meta.Model
{

    @meta.string
    name = "";

    @meta.boolean
    isShared = false;

    @meta.list("Tr2StateMachine")
    stateMachines = [];

    @meta.list("Tr2ControllerFloatVariable")
    variables = [];

    @meta.list("Tr2ControllerEventHandler")
    eventHandlers = [];

    _owner = null;

    _time = 0;

    _dirtyVariables = null;

    _updateables = null;

    _callbacks = null;

    _isActive = false;

    OnListModified(event, key, key2, value, list)
    {
        const eventName = String(event || "").toLowerCase();
        if (list === this.stateMachines || (!list && this.stateMachines.includes(value)))
        {
            const stateMachine = value;
            if (eventName.includes("remove"))
            {
                if (this._isActive && stateMachine && stateMachine.Stop) stateMachine.Stop();
                if (stateMachine && stateMachine.Unlink) stateMachine.Unlink();
            }
            else if (this._owner && stateMachine && stateMachine.Link)
            {
                stateMachine.Link(this);
                if (this._isActive && stateMachine.Start) stateMachine.Start();
            }
            return;
        }

        if (list === this.eventHandlers || (!list && this.eventHandlers.includes(value)))
        {
            const handler = value;
            if (eventName.includes("remove"))
            {
                if (handler && handler.Unlink) handler.Unlink();
            }
            else if (this._owner && handler && handler.Link)
            {
                handler.Link(this);
            }
            return;
        }

        if (list === this.variables || (!list && this.variables.includes(value)))
        {
            if (this._owner)
            {
                this.ReLink();
            }
        }
    }

    Link(owner)
    {
        this.Unlink();
        this._owner = owner || null;
        this._dirtyVariables = new Set(this.variables.map(variable => variable.name));
        this._updateables = new Set();
        if (!this._callbacks) this._callbacks = [];

        for (let i = 0; i < this.variables.length; i++)
        {
            const variable = this.variables[i];
            if (variable)
            {
                if (variable.SetDestinationBuffer) variable.SetDestinationBuffer(variable);
            }
        }

        for (let i = 0; i < this.stateMachines.length; i++)
        {
            const stateMachine = this.stateMachines[i];
            if (stateMachine && stateMachine.Link)
            {
                stateMachine.Link(this);
            }
        }

        for (let i = 0; i < this.eventHandlers.length; i++)
        {
            const handler = this.eventHandlers[i];
            if (handler && handler.Link)
            {
                handler.Link(this);
            }
        }
    }

    Initialize(owner)
    {
        this.Link(owner);
        this.Start();
    }

    Unlink()
    {
        if (this._owner || this._isActive)
        {
            this.Stop();
        }

        for (let i = 0; i < this.variables.length; i++)
        {
            const variable = this.variables[i];
            if (variable)
            {
                if (variable.SetDestinationBuffer) variable.SetDestinationBuffer(null);
                if (variable.SetDirtyMask) variable.SetDirtyMask(null, 0);
            }
        }

        for (let i = 0; i < this.stateMachines.length; i++)
        {
            const stateMachine = this.stateMachines[i];
            if (stateMachine && stateMachine.Unlink)
            {
                stateMachine.Unlink();
            }
        }

        for (let i = 0; i < this.eventHandlers.length; i++)
        {
            const handler = this.eventHandlers[i];
            if (handler && handler.Unlink)
            {
                handler.Unlink();
            }
        }

        this._owner = null;
        this._dirtyVariables = null;
        this._updateables = null;
    }

    ReLink()
    {
        if (this._owner)
        {
            const owner = this._owner;
            this.Link(owner);
        }
    }

    IsLinked()
    {
        return !!this._owner;
    }

    Start()
    {
        if (this._isActive)
        {
            this.Stop();
        }

        this._dirtyVariables = new Set(this.variables.map(variable => variable.name));
        for (let i = 0; i < this.stateMachines.length; i++)
        {
            const stateMachine = this.stateMachines[i];
            if (stateMachine && stateMachine.Start)
            {
                stateMachine.Start();
            }
        }

        this._isActive = true;
    }

    Stop()
    {
        if (!this._isActive)
        {
            return;
        }

        for (let i = 0; i < this.stateMachines.length; i++)
        {
            const stateMachine = this.stateMachines[i];
            if (stateMachine && stateMachine.Stop)
            {
                stateMachine.Stop();
            }
        }

        this._isActive = false;
    }

    Update(dt = 0)
    {
        if (!this._isActive)
        {
            return;
        }

        this._time += dt;
        const dirtyVariables = this._dirtyVariables || new Set();
        this._dirtyVariables = new Set();

        for (let i = 0; i < this.stateMachines.length; i++)
        {
            const stateMachine = this.stateMachines[i];
            if (stateMachine && stateMachine.Update)
            {
                stateMachine.Update(dt, dirtyVariables);
            }
        }

        if (this._updateables)
        {
            for (const updateable of Array.from(this._updateables))
            {
                if (updateable && updateable.Update)
                {
                    updateable.Update(dt, this, this._owner);
                }
            }
        }
    }

    HandleEvent(eventName)
    {
        if (!this._isActive || !eventName)
        {
            return false;
        }

        let handled = false;
        for (let i = 0; i < this.eventHandlers.length; i++)
        {
            const handler = this.eventHandlers[i];
            const name = handler && handler.GetName ? handler.GetName() : handler && handler.name;
            if (handler && name === eventName && handler.Execute)
            {
                handler.Execute(this);
                handled = true;
            }
        }

        return handled;
    }

    SetVariable(name, value)
    {
        return this.SetVariableValue(name, value);
    }

    GetOwner()
    {
        return this._owner;
    }

    GetTime()
    {
        return this._time;
    }

    GetVariableByName(name)
    {
        return this.variables.find(x => x.name === name) || null;
    }

    FindVariable(name)
    {
        return this.GetVariableByName(name);
    }

    GetFloatVariableByName(name)
    {
        const variable = this.GetVariableByName(name);
        return variable && variable.GetValue ? variable.GetValue() : variable ? variable.value : null;
    }

    GetExpressionTermInfo(out = [])
    {
        for (let i = 0; i < this.variables.length; i++)
        {
            const variable = this.variables[i];
            if (variable && variable.name)
            {
                out.push({
                    group: "Variables",
                    name: variable.name,
                    description: "controller variable"
                });
            }
        }
        return out;
    }

    GetVariables()
    {
        return this.variables;
    }

    GetVariableView()
    {
        return this.variables.map((variable, index) => ({
            name: variable.name,
            type: 0,
            offset: index
        }));
    }

    GetVariableBuffer()
    {
        return this.variables;
    }

    EnsureTempArenaSize()
    {
    }

    GetTempArena()
    {
        return null;
    }

    GetVariableValue(name, fallback = 0)
    {
        const variable = this.GetVariableByName(name);
        return variable ? variable.value : fallback;
    }

    SetVariableValue(name, value)
    {
        const variable = this.GetVariableByName(name);
        if (variable)
        {
            if (variable.SetValue) variable.SetValue(value);
            else variable.value = value;

            if (!this._dirtyVariables) this._dirtyVariables = new Set();
            this._dirtyVariables.add(name);
        }
        return !!variable;
    }

    GetBindingPathRoots()
    {
        const roots = [];
        if (this._owner)
        {
            roots.push([ "Owner", this._owner ]);
            roots.push([ "owner", this._owner ]);
        }

        for (let i = 0; i < this.variables.length; i++)
        {
            const variable = this.variables[i];
            if (variable && variable.name)
            {
                roots.push([ variable.name, variable ]);
            }
        }

        return roots;
    }

    GetBindingRoots()
    {
        const roots = {};
        const list = this.GetBindingPathRoots();
        for (let i = 0; i < list.length; i++)
        {
            roots[list[i][0]] = list[i][1];
        }
        roots.Controller = this;
        roots.controller = this;
        return roots;
    }

    GetExpressionContext(owner, stateMachine, extra = {})
    {
        return {
            ...extra,
            controller: this,
            owner: owner || this._owner,
            stateMachine,
            time: this._time
        };
    }

    RegisterUpdateable(updateable)
    {
        if (!this._updateables) this._updateables = new Set();
        this._updateables.add(updateable);
    }

    UnRegisterUpdateable(updateable)
    {
        if (this._updateables) this._updateables.delete(updateable);
    }

    IsUpdateableRegistered(updateable)
    {
        return !!(this._updateables && this._updateables.has(updateable));
    }

    RegisterCallback(name, callback)
    {
        if (!name || typeof callback !== "function")
        {
            return false;
        }

        if (!this._callbacks) this._callbacks = [];
        this._callbacks.push([ name, callback ]);
        return true;
    }

    ClearCallbacks()
    {
        if (!this._callbacks) this._callbacks = [];
        this._callbacks.length = 0;
    }

    GetCallbackCount()
    {
        return this._callbacks ? this._callbacks.length : 0;
    }

    Callback(name)
    {
        if (!this._isActive || !this._callbacks || !name)
        {
            return false;
        }

        let called = false;
        for (let i = 0; i < this._callbacks.length; i++)
        {
            const callback = this._callbacks[i];
            if (callback && callback[0] === name && typeof callback[1] === "function")
            {
                callback[1](name, this, this._owner);
                called = true;
            }
        }

        return called;
    }
}
