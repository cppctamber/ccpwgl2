import { meta } from "utils";


@meta.type("Tr2StateMachine")
@meta.ccp.define("Tr2StateMachine")
export class Tr2StateMachine extends meta.Model
{

    @meta.string
    name = "";

    /**
     * The state this machine begins in.
     *
     * Carbon persists this as an OBJECT REFERENCE - `Tr2StateMachineStatePtr
     * m_startState`, exposed as `MAP_ATTRIBUTE("startState", m_startState, ...)`
     * (`Tr2StateMachine.h:46`, `Tr2StateMachine_Blue.cpp:18`) - not an index.
     * ccpwgl declared it `@meta.uint`, so it read the raw reference id as a
     * number: real content deserialised to values like 1237 and 1262 against
     * six-state machines, `states[1262]` was undefined, and every machine fell
     * back to `states[0]`.
     *
     * That is not a cosmetic difference. These machines are authored with a
     * `Start` state that caches each range's duration into a controller variable
     * (`Tr2ActionSetValue` with `value: CurveSetTime("Set/Range")`), and every
     * later transition asks "has the range finished?" by comparing
     * `StateTime() > _CurveSetTime_Set_Range`. Starting elsewhere means those
     * variables are never written, so every such test reads 0, is true one frame
     * after entry, and the machine walks its whole ring at a state per frame -
     * replaying a different range of the same curve set every frame, so nothing
     * ever plays through. That is the violent flicker on the Triglavian hologram
     * VFX, and the reason docking VFX snapped on instead of easing in.
     *
     * Kept tolerant of a number so a machine authored with a genuine index still
     * starts where it says - see `GetStartState`.
     *
     * @type {Tr2StateMachineState|Number|null}
     */
    @meta.notOwned
    @meta.struct("Tr2StateMachineState")
    startState = null;

    @meta.list("Tr2StateMachineState")
    states = [];

    _controller = null;

    _currentState = null;

    _machineTime = 0;

    _stateTime = 0;

    // Cache for GetAllVariableNames; cleared whenever the controller changes.
    _allVariableNames = null;

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
        this._allVariableNames = null;

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

        this._currentState = this.GetStartState();
        this._machineTime = 0;
        this._stateTime = 0;
        if (this._currentState && this._currentState.Start)
        {
            this._currentState.Start(this._controller);
            this.FollowTransitions(this.GetAllVariableNames());
        }
    }

    /**
     * Resolves `startState` to an actual state.
     *
     * Carbon stores an object reference and simply assigns it
     * (`Tr2StateMachine.cpp:160`); if it is null the machine does not start at
     * all (`:162-165`). ccpwgl falls back to `states[0]` instead of refusing,
     * because a machine that silently never runs is far harder to notice than
     * one that starts in the wrong place - but the fallback is now the last
     * resort it was meant to be, not the normal path.
     *
     * A number is still honoured as an index, so content authored that way keeps
     * working.
     *
     * @returns {Tr2StateMachineState|null}
     */
    GetStartState()
    {
        const start = this.startState;

        // An object reference, as Carbon persists it. Trust it only if it is
        // actually one of this machine's states - a reference that did not
        // resolve is worse than the fallback.
        if (start && typeof start === "object")
        {
            if (this.states.includes(start)) return start;
        }
        else if (typeof start === "number" && start >= 0 && start < this.states.length)
        {
            return this.states[start];
        }

        return this.states[0] || null;
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

        // Cached: this was rebuilt on every hop of every machine, every frame -
        // an array from `map` plus a Set - for a value nothing reads. The
        // variable list only changes when the controller relinks, and `Link`
        // clears this.
        if (!this._allVariableNames || this._allVariableNames.size !== variables.length)
        {
            this._allVariableNames = new Set(variables.map(variable => variable.name));
        }

        return this._allVariableNames;
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
        // Each hop re-evaluates with EVERY variable dirty, which is what lets a
        // zero-duration chain continue inside one frame; an empty set here means
        // the opposite.
        //
        // SELF-TRANSITIONS ARE REFUSED, and this is a deliberate divergence.
        // Carbon loops on `next` alone, so a state may re-enter itself and
        // restart its actions. That is safe THERE because a transition is only
        // re-evaluated when a variable it reads changes
        // (`Tr2StateMachineState.cpp:210`). ccpwgl evaluates every condition
        // live every frame on purpose (D038, and the state-loss note in
        // `Tr2StateMachineTransition.CanTransition`), so the same loop turns a
        // self-transition whose condition merely STAYS true into a restart on
        // every frame - `Tr2ActionPlayCurveSet.Start` replays its curve set from
        // zero each time, and nothing visibly animates again. Allowing it on
        // 2026-08-19 stopped VFX across both backends.
        //
        // The dirty-variable gate that made this necessary now exists
        // (`Tr2StateMachineTransition.CanTransition`), so a self-transition would
        // no longer restart on a condition that merely stays true. Restoring
        // Carbon's behaviour here is a SEPARATE change and needs its own run in
        // the client - Carbon leans on a loop detector to survive it
        // (`Tr2StateMachine.cpp:120-140`) and ccpwgl only has the hop cap below.
        for (let i = 0; next && next !== this._currentState && i < 20; i++)
        {
            this._currentState = next;
            this._stateTime = 0;
            if (this._currentState.Start) this._currentState.Start(this._controller);

            // Carbon re-evaluates each hop with every variable dirty
            // (`Tr2StateMachine.cpp:148`) so a zero-duration chain continues in
            // the same frame. ccpwgl's transitions never read the dirty set -
            // they evaluate live, by design - so the cached set is passed rather
            // than a fresh one built per hop. If gating is ever implemented, THIS
            // is the call that has to say "everything changed".
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
