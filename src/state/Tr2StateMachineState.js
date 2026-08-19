import { meta } from "utils";


@meta.type("Tr2StateMachineState")
@meta.ccp.define("Tr2StateMachineState")
export class Tr2StateMachineState extends meta.Model
{

    @meta.string
    name = "";

    @meta.list("Tw2Action")
    actions = [];

    @meta.struct()
    finalizer = null;

    @meta.list("Tr2StateMachineTransition")
    transitions = [];

    _stateMachine = null;

    _isActive = false;

    // Set when the state wanted to leave but its finalizer said "not yet"
    // (Carbon `Tr2StateMachineState.cpp:315`). The state stays ACTIVE while
    // finalizing - its actions have been stopped, but it has not handed over -
    // and `Update` re-asks the finalizer each frame until it permits.
    _isFinalizing = false;

    OnModified()
    {
        const controller = this._stateMachine && this._stateMachine.GetController ? this._stateMachine.GetController() : null;
        if (this.finalizer && this.finalizer.Link)
        {
            this.finalizer.Link(controller);
        }
        return true;
    }

    OnListModified(event, key, key2, value, list)
    {
        const eventName = String(event || "").toLowerCase();
        if (list === this.actions || (!list && this.actions.includes(value)))
        {
            const action = value;
            const controller = this._stateMachine && this._stateMachine.GetController ? this._stateMachine.GetController() : null;
            if (eventName.includes("remove"))
            {
                if (this._isActive && action && action.Stop) action.Stop(controller);
                if (action && action.Unlink) action.Unlink();
            }
            else if (this._stateMachine && action && action.Link)
            {
                action.Link(controller);
                if (this._isActive && action.Start) action.Start(controller);
            }
            return;
        }

        if (list === this.transitions || (!list && this.transitions.includes(value)))
        {
            const transition = value;
            if (eventName.includes("remove"))
            {
                if (transition && transition.Unlink) transition.Unlink();
            }
            else if (this._stateMachine && transition && transition.Link)
            {
                transition.Link(this);
            }
            this.UpdateVariableMask();
        }
    }

    Link(stateMachine)
    {
        this.Unlink();
        this._stateMachine = stateMachine || null;

        const controller = stateMachine && stateMachine.GetController ? stateMachine.GetController() : null;
        for (let i = 0; i < this.transitions.length; i++)
        {
            const transition = this.transitions[i];
            if (transition && transition.Link)
            {
                transition.Link(this);
            }
        }

        for (let i = 0; i < this.actions.length; i++)
        {
            const action = this.actions[i];
            if (action && action.Link)
            {
                action.Link(controller);
            }
        }

        if (this.finalizer && this.finalizer.Link)
        {
            this.finalizer.Link(controller);
        }
    }

    Unlink()
    {
        this.Stop();

        for (let i = 0; i < this.transitions.length; i++)
        {
            const transition = this.transitions[i];
            if (transition && transition.Unlink)
            {
                transition.Unlink();
            }
        }

        for (let i = 0; i < this.actions.length; i++)
        {
            const action = this.actions[i];
            if (action && action.Unlink)
            {
                action.Unlink();
            }
        }

        if (this.finalizer && this.finalizer.Unlink)
        {
            this.finalizer.Unlink();
        }

        this._stateMachine = null;
    }

    UpdateVariableMask()
    {
    }

    Start(controller)
    {
        if (this._isActive)
        {
            return;
        }

        const owner = controller && controller.GetOwner ? controller.GetOwner() : null;
        for (let i = 0; i < this.actions.length; i++)
        {
            const action = this.actions[i];
            if (action && action.Start && !action.isDisabled)
            {
                action.Start(controller, owner);
            }
        }

        this._isActive = true;
        this._isFinalizing = false;
    }

    /**
     * Stops the state's actions and releases it - unless a finalizer refuses,
     * in which case the state stays active and enters finalizing, and `Update`
     * re-asks each frame until it permits (Carbon `Tr2StateMachineState.cpp:293-321`).
     *
     * The actions are stopped either way: Carbon schedules their `Stop` before
     * consulting the finalizer, so a held state is one whose actions have ended
     * but whose hand-over has not happened yet.
     */
    Stop(controller)
    {
        if (!this._isActive || this._isFinalizing)
        {
            return;
        }

        controller = controller || (this._stateMachine && this._stateMachine.GetController ? this._stateMachine.GetController() : null);
        const owner = controller && controller.GetOwner ? controller.GetOwner() : null;
        for (let i = 0; i < this.actions.length; i++)
        {
            const action = this.actions[i];
            if (action && action.Stop && !action.isDisabled)
            {
                action.Stop(controller, owner);
            }
        }

        if (this.finalizer && this.finalizer.CanTransition && !this.finalizer.CanTransition(controller, owner))
        {
            this._isFinalizing = true;
            return;
        }

        this._isActive = false;
    }

    Update(dt, controller, owner, stateMachine = this._stateMachine, dirtyVariables)
    {
        if (!this._isActive)
        {
            return null;
        }

        // Finalizing: the actions are already stopped and the state is only
        // waiting for the finalizer's permission, so it must not tick them
        // again (Carbon `Tr2StateMachineState.cpp:190-204`).
        if (this._isFinalizing)
        {
            const next = this.GetNextState(stateMachine, controller, owner);

            // No destination to hand to: leave the limbo by restarting in place.
            if (!next)
            {
                this._isActive = false;
                this.Start(controller);
            }

            if (!this.finalizer || !this.finalizer.CanTransition || this.finalizer.CanTransition(controller, owner))
            {
                return next;
            }

            return null;
        }

        for (let i = 0; i < this.actions.length; i++)
        {
            const action = this.actions[i];
            if (action && action.Update && !action.isDisabled && !(controller && controller.IsUpdateableRegistered && controller.IsUpdateableRegistered(action)))
            {
                action.Update(dt, controller, owner);
            }
        }

        for (let i = 0; i < this.transitions.length; i++)
        {
            const transition = this.transitions[i];
            if (!transition || !transition.CanTransition) continue;
            if (!transition.CanTransition(controller, owner, stateMachine, dirtyVariables)) continue;

            // An unresolved destination makes the transition INELIGIBLE, so the
            // walk continues past it; Carbon tests it alongside the condition
            // (`Tr2StateMachineState.cpp:216`). Returning null here instead
            // would let one dangling transition mask every transition below it.
            const destination = transition.GetDestination(stateMachine);
            if (!destination) continue;

            // A veto abandons the WHOLE walk for this frame - the first
            // eligible transition decides, and if an action refuses it, no
            // other transition may stand in for it
            // (`Tr2StateMachineState.cpp:214-224`, and runtime-trinity does the
            // same). Falling through to the next transition here used to send
            // the machine to a state Carbon would never have entered.
            if (!this.CanTransition(controller, owner))
            {
                return null;
            }

            this.Stop(controller);

            // The finalizer refused during Stop: hold, and hand over on a later
            // frame through the finalizing branch above.
            if (this._isFinalizing)
            {
                return null;
            }

            return destination;
        }

        return null;
    }

    RebaseSimTime(diff)
    {
        for (let i = 0; i < this.actions.length; i++)
        {
            const action = this.actions[i];
            if (action && action.RebaseSimTime)
            {
                action.RebaseSimTime(diff);
            }
        }
    }

    /**
     * Finds the state this one would hand over to, without changing anything.
     *
     * Pure by contract: the finalizing branch of `Update` calls it every frame,
     * so it must not tick actions or stop the state. It previously delegated to
     * `Update(0)`, which did both - with `controller` and `owner` undefined.
     *
     * @param {Tr2StateMachine} [stateMachine]
     * @param {Tr2Controller} [controller]
     * @param {Object} [owner]
     * @returns {Tr2StateMachineState|null}
     */
    GetNextState(stateMachine = this._stateMachine, controller, owner)
    {
        controller = controller || (stateMachine && stateMachine.GetController ? stateMachine.GetController() : null);
        owner = owner || (controller && controller.GetOwner ? controller.GetOwner() : null);

        for (let i = 0; i < this.transitions.length; i++)
        {
            const transition = this.transitions[i];
            if (!transition || !transition.CanTransition) continue;
            if (!transition.CanTransition(controller, owner, stateMachine)) continue;

            const destination = transition.GetDestination(stateMachine);
            if (destination) return destination;
        }

        return null;
    }

    /**
     * Asks the state's actions whether they will allow it to be left.
     *
     * Actions only. The finalizer is NOT consulted here: Carbon asks it in
     * `Stop()`, where refusing puts the state into finalizing rather than
     * silently rejecting one transition (`Tr2StateMachineState.cpp:214-224` vs
     * `:293-321`). Asking it here as well would make a held state fall through
     * to whatever transition it could still satisfy.
     *
     * @param {Tr2Controller} controller
     * @param {Object} owner
     * @returns {Boolean}
     */
    CanTransition(controller, owner)
    {
        for (let i = 0; i < this.actions.length; i++)
        {
            const action = this.actions[i];
            if (action && action.CanTransition && !action.CanTransition(controller, owner))
            {
                return false;
            }
        }

        return true;
    }

    GetName()
    {
        return this.name;
    }

    GetStateMachine()
    {
        return this._stateMachine;
    }

    GetStateMachinePtr()
    {
        return this.GetStateMachine();
    }
}
