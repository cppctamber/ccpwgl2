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

        // Always evaluate the condition against the live value; never gate on `dirtyVariables`.
        // Gating on dirtiness lost "last instruction wins" across a transition: while a transition
        // state plays (it advances only on IsAnimationPlaying==0), the target variable can be set
        // several times, but the controller clears the dirty flag each frame — so by the time the
        // destination state is entered the change was no longer "dirty" and its variable conditions
        // were skipped, stranding the machine. Evaluating live lets the destination state route to
        // the latest requested value the instant it becomes current, without interrupting the
        // in-flight transition. (`dirtyVariables` is still passed in as an unused fast-path hint.)
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
