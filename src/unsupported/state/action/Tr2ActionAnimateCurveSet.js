import { meta } from "utils";
import { Tr2ExpressionProgram } from "../expression/Tr2ExpressionProgram";
import { Tw2Action } from "./Tw2Action";


@meta.type("Tr2ActionAnimateCurveSet")
@meta.ccp.define("Tr2ActionAnimateCurveSet")
export class Tr2ActionAnimateCurveSet extends Tw2Action
{

    @meta.struct("Tw2CurveSet")
    curveSet = null;

    @meta.string
    value = "StateTime()";

    _controller = null;

    _program = null;

    _programSource = null;

    _startTime = 0;

    _lastTime = 0;

    Link(controller)
    {
        this._controller = controller || null;
        this.CompileExpression();
    }

    Unlink()
    {
        this._controller = null;
        this._program = null;
        this._programSource = null;
    }

    Start(controller)
    {
        if (!this.curveSet)
        {
            return false;
        }

        this._controller = controller || this._controller;
        this._startTime = controller && controller.GetTime ? controller.GetTime() : 0;
        this._lastTime = this._startTime;

        if (controller && controller.RegisterUpdateable)
        {
            controller.RegisterUpdateable(this);
        }

        return true;
    }

    Stop(controller)
    {
        if (controller && controller.UnRegisterUpdateable)
        {
            controller.UnRegisterUpdateable(this);
        }
    }

    RebaseSimTime(diff)
    {
        this._startTime += diff;
        this._lastTime += diff;
    }

    Update(dt, controller, owner)
    {
        controller = controller || this._controller;
        owner = owner || (controller && controller.GetOwner ? controller.GetOwner() : null);
        this._lastTime = controller && controller.GetTime ? controller.GetTime() : this._lastTime + dt;

        if (!this.curveSet)
        {
            return;
        }

        const program = this.CompileExpression();
        if (!program.IsValid())
        {
            return;
        }

        const value = program.Evaluate(this.GetExpressionContext(controller, owner));
        if (this.curveSet.ApplyTime)
        {
            this.curveSet.ApplyTime(value);
        }
    }

    CompileExpression()
    {
        if (!this._program || this._programSource !== this.value)
        {
            this._program = Tr2ExpressionProgram.Compile(this.value, { emptyValue: 0 });
            this._programSource = this.value;
        }
        return this._program;
    }

    GetExpressionContext(controller, owner)
    {
        const stateTime = this._lastTime - this._startTime;
        return controller && controller.GetExpressionContext
            ? controller.GetExpressionContext(owner, null, { action: this, stateTime })
            : { controller, owner, action: this, stateTime, time: this._lastTime };
    }

    IsExpressionValid()
    {
        return this.CompileExpression().IsValid();
    }

}
