import { meta } from "utils";


@meta.type("Tr2StateMachineTransition")
@meta.ccp.define("Tr2StateMachineTransition")
export class Tr2StateMachineTransition extends meta.Model
{

    @meta.string
    name = "";

    @meta.string
    condition = "";

    _source = null;

    Link(state)
    {
        this.Unlink();
        this._source = state || null;
    }

    Unlink()
    {
        this._source = null;
    }

    OnModified()
    {
        this.UpdateDestination();
        return true;
    }

    UpdateDestination()
    {
    }

    CanTransition()
    {
        return !this.condition;
    }

    CanActivate(...args)
    {
        return this.CanTransition(...args);
    }

    GetDestination(stateMachine)
    {
        stateMachine = stateMachine || (this._source && this._source.GetStateMachine ? this._source.GetStateMachine() : null);
        if (!stateMachine || !this.name)
        {
            return null;
        }

        return stateMachine.GetStateByName ? stateMachine.GetStateByName(this.name) : null;
    }

    GetVariableMask()
    {
        return this.condition ? 0 : -1;
    }

    GetSource()
    {
        return this._source;
    }

    GetState()
    {
        return this.GetSource();
    }

    IsConditionValid()
    {
        return !this.condition;
    }

    IsExpressionValid()
    {
        return this.IsConditionValid();
    }

    EvaluateExpression()
    {
        return 0;
    }

    GetExpressionTermInfo()
    {
        return [];
    }
}
