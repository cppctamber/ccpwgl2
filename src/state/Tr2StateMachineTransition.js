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

    // Cached GetVariableMask result, and the condition it was built from.
    // Undefined rather than null so the first call cannot match `_programSource`.
    _variableMask = null;
    _variableMaskSource = undefined;

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

        // A condition that names controller variables is only re-asked when one
        // of them CHANGED (Carbon `Tr2StateMachineTransition.cpp:73-77`). Without
        // this, a condition that merely STAYS true fires on every frame, and a
        // state machine driving curve sets restarts them from zero sixty times a
        // second - which is what made the hologram VFX strobe.
        //
        // A null mask means "cannot be narrowed" - no condition, one that failed
        // to compile, or one calling a clock, a random or an animation query -
        // and is always evaluated, exactly as Carbon's zero mask is. An EMPTY set
        // (a constant condition) is likewise always evaluated, because Carbon
        // cannot tell those two apart either. A missing `dirtyVariables` means
        // "everything changed": entry into a state and `GetNextState` both ask
        // that way, so a state always evaluates its conditions live on the frame
        // it is entered.
        //
        // That entry rule is what makes this safe, and it is where a previous
        // cycle went wrong: gating was removed wholesale on the theory that a
        // variable written several times during an in-flight transition would no
        // longer be dirty by the time the destination state was entered. It
        // cannot strand the machine. The in-flight state advances on
        // `IsAnimationPlaying`, a non-pure function, so its mask is null and it
        // is never gated; and the hop into the destination passes every variable
        // name, so the destination routes to the latest value on arrival.
        if (dirtyVariables)
        {
            const mask = this.GetVariableMask();
            if (mask && mask.size)
            {
                let touched = false;
                for (const name of mask)
                {
                    if (dirtyVariables.has(name))
                    {
                        touched = true;
                        break;
                    }
                }
                if (!touched) return false;
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
     * `CanTransition` gates on this, so it is asked once per transition per
     * frame and must not allocate - the Set is cached against the condition the
     * program was compiled from, and `Compile` rebuilds both when it changes.
     *
     * @returns {Set<String>|null}
     */
    GetVariableMask()
    {
        if (!this.condition) return null;

        const program = this.Compile();
        if (this._variableMaskSource === this._programSource) return this._variableMask;

        this._variableMaskSource = this._programSource;
        this._variableMask = !program.IsValid() || (program.HasNonPureFunctions && program.HasNonPureFunctions())
            ? null
            : new Set(this._variableNames);

        return this._variableMask;
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
