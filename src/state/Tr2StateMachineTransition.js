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

    /**
     * The controller variables this transition's condition actually reads, or
     * null when it cannot be described that way.
     *
     * Carbon packs this into a 64-bit mask of variable indices and drops it to
     * zero - "assume everything" - when the condition calls a non-pure function
     * (`Tr2ControllerExpression.cpp:509-515,556`). ccpwgl has no packed variable
     * buffer to index, and tracks dirtiness by NAME, so the same idea is a Set
     * of names and null is the "assume everything" case:
     *
     *   - null  -> no condition, a condition that failed to compile, or one that
     *              calls a clock, a random or an animation query, so a variable
     *              list cannot describe when it changes;
     *   - Set   -> exactly the variables it reads. Empty means it reads none,
     *              i.e. it is constant.
     *
     * NOTHING GATES ON THIS. ccpwgl evaluates every condition every frame on
     * purpose - see the note in `CanTransition`, and D038. This is published so
     * a consumer can ask which variables a hull responds to without walking the
     * expression itself.
     *
     * @returns {Set<String>|null}
     */
    GetVariableMask()
    {
        if (!this.condition) return null;

        const program = this.Compile();
        if (!program.IsValid()) return null;
        if (program.HasNonPureFunctions && program.HasNonPureFunctions()) return null;

        return new Set(this._variableNames);
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
