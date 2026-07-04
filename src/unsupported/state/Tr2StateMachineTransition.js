import { meta } from "utils";
import { Tr2ExpressionProgram } from "./expression/Tr2ExpressionProgram";


@meta.type("Tr2StateMachineTransition")
@meta.ccp.define("Tr2StateMachineTransition")
export class Tr2StateMachineTransition extends meta.Model
{

    @meta.string
    name = "";

    @meta.string
    condition = "";

    _source = null;
    _program = null;
    _programSource = null;
    _variableNames = [];
    _functionNames = [];

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

    Compile()
    {
        if (!this._program || this._programSource !== this.condition)
        {
            this._program = Tr2ExpressionProgram.Compile(this.condition, { emptyValue: 1 });
            this._programSource = this.condition;
            this._variableNames = this._program.GetVariableNames();
            this._functionNames = this._program.GetFunctionNames();
        }
        return this._program;
    }

    CanTransition(controller, owner, stateMachine, dirtyVariables)
    {
        const program = this.Compile();
        if (!program.IsValid())
        {
            return false;
        }

        if (dirtyVariables && dirtyVariables.size && this._variableNames.length && !this._functionNames.length)
        {
            let hasDirtyVariable = false;
            for (let i = 0; i < this._variableNames.length; i++)
            {
                if (dirtyVariables.has(this._variableNames[i]))
                {
                    hasDirtyVariable = true;
                    break;
                }
            }
            if (!hasDirtyVariable)
            {
                return false;
            }
        }

        const context = controller && controller.GetExpressionContext ? controller.GetExpressionContext(owner, stateMachine) : { controller, owner, stateMachine };
        return program.EvaluateBoolean(context);
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
        return this.Compile().IsValid();
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
