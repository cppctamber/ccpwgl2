import { meta } from "utils";


@meta.type("Tr2StateMachine")
@meta.ccp.define("Tr2StateMachine")
export class Tr2StateMachine extends meta.Model
{

    @meta.string
    name = "";

    @meta.uint
    startState = 0;

    @meta.list("Tr2StateMachineState")
    states = [];

    _controller = null;

    _currentState = null;

    _machineTime = 0;

    _stateTime = 0;

    OnSimClockRebase(oldTime, newTime)
    {
        const diff = newTime - oldTime;
        this._machineTime += diff;
        this._stateTime += diff;

        for (let i = 0; i < this.states.length; i++)
        {
            const state = this.states[i];
            if (state && state.RebaseSimTime)
            {
                state.RebaseSimTime(diff);
            }
        }
    }

    OnListModified(event, key, key2, value, list)
    {
        if (list && list !== this.states)
        {
            return;
        }

        const state = value;
        if (!state)
        {
            return;
        }

        const eventName = String(event || "").toLowerCase();
        if (eventName.includes("remove"))
        {
            if (state === this._currentState && state.Stop)
            {
                state.Stop(this._controller);
            }
            if (state.Unlink) state.Unlink();
        }
        else if (this._controller && state.Link)
        {
            state.Link(this);
        }
    }

    OnModified()
    {
        return true;
    }

    Link(controller)
    {
        this.Unlink();
        this._controller = controller || null;

        for (let i = 0; i < this.states.length; i++)
        {
            const state = this.states[i];
            if (state && state.Link)
            {
                state.Link(this);
            }
        }
    }

    Unlink()
    {
        this.Stop();

        for (let i = 0; i < this.states.length; i++)
        {
            const state = this.states[i];
            if (state && state.Unlink)
            {
                state.Unlink();
            }
        }

        this._controller = null;
    }

    Start()
    {
        if (this._currentState || !this._controller)
        {
            return;
        }

        this._currentState = this.states[this.startState] || this.states[0] || null;
        this._machineTime = 0;
        this._stateTime = 0;
        if (this._currentState && this._currentState.Start)
        {
            this._currentState.Start(this._controller);
            this.FollowTransitions(this.GetAllVariableNames());
        }
    }

    /**
     * Every variable name the controller declares - ccpwgl's spelling of
     * Carbon's all-bits-set dirty mask (`0xffffffffffffffffull`). ccpwgl tracks
     * dirtiness by name rather than by bit index, so "everything is dirty" is
     * the full name set.
     * @returns {Set<String>}
     */
    GetAllVariableNames()
    {
        const variables = this._controller && this._controller.variables ? this._controller.variables : [];
        return new Set(variables.map(variable => variable.name));
    }

    Stop()
    {
        if (this._currentState && this._currentState.Stop)
        {
            this._currentState.Stop(this._controller);
        }

        this._currentState = null;
        this._machineTime = 0;
        this._stateTime = 0;
    }

    Update(dt = 0, dirtyVariables)
    {
        if (!this._currentState)
        {
            return;
        }

        this._machineTime += dt;
        this._stateTime += dt;
        this.FollowTransitions(dirtyVariables, dt);
    }

    FollowTransitions(dirtyVariables, dt = 0)
    {
        if (!this._currentState || !this._currentState.Update)
        {
            return;
        }

        const owner = this._controller && this._controller.GetOwner ? this._controller.GetOwner() : null;
        let next = this._currentState.Update(dt, this._controller, owner, this, dirtyVariables);

        // The state stops ITSELF inside Update before handing over its
        // destination, exactly as Carbon does, so this loop must not stop it
        // again - it only enters the next one (`Tr2StateMachine.cpp:143-149`).
        //
        // Two things follow from copying Carbon's loop condition:
        //   - a state may transition to ITSELF; Stop() has already deactivated
        //     it, so Start() re-runs its actions instead of no-opping;
        //   - each hop re-evaluates with EVERY variable dirty, which is what
        //     lets a zero-duration chain continue inside one frame. Passing an
        //     empty set here (as this did) means the opposite.
        for (let i = 0; next && i < 20; i++)
        {
            this._currentState = next;
            this._stateTime = 0;
            if (this._currentState.Start) this._currentState.Start(this._controller);
            next = this._currentState.Update(0, this._controller, owner, this, this.GetAllVariableNames());
        }
    }

    GetController()
    {
        return this._controller;
    }

    GetCurrentState()
    {
        return this._currentState;
    }

    GetState(index)
    {
        return this.states[index] || null;
    }

    GetStateByName(name)
    {
        return this.states.find(state => state.name === name) || null;
    }

    GetMachineRunTime()
    {
        return this._machineTime;
    }

    GetStateRunTime()
    {
        return this._stateTime;
    }

    GetStateTime()
    {
        return this._stateTime;
    }
}
