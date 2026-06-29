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
    }

    Stop(controller)
    {
        if (!this._isActive)
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

        this._isActive = false;
    }

    Update(dt, controller, owner, stateMachine = this._stateMachine, dirtyVariables)
    {
        if (!this._isActive)
        {
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
            if (transition && transition.CanTransition && transition.CanTransition(controller, owner, stateMachine, dirtyVariables))
            {
                if (this.CanTransition(controller, owner))
                {
                    return transition.GetDestination(stateMachine);
                }
            }
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

    GetNextState()
    {
        return this.Update(0);
    }

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

        return !this.finalizer || !this.finalizer.CanTransition || this.finalizer.CanTransition(controller, owner);
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
