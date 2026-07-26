import { meta } from "utils";
import { Tr2BindingPoint } from "../controller";
import { Tr2ExpressionProgram } from "../expression/Tr2ExpressionProgram";
import { Tw2Action } from "./Tw2Action";


@meta.type("Tr2ActionAnimateValue")
@meta.ccp.define("Tr2ActionAnimateValue")
export class Tr2ActionAnimateValue extends Tw2Action
{

    @meta.string
    attribute = "";

    @meta.boolean
    delayBinding = false;

    @meta.struct("Tr2CurveScalarExpression")
    curve = null;

    @meta.notOwned
    @meta.struct()
    destination = null;

    @meta.string
    path = "";

    @meta.string
    value = "Curve(StateTime())";

    _bindingPoint = null;

    _controller = null;

    _program = null;

    _programSource = null;

    _startTime = 0;

    _lastTime = 0;

    Link(controller, owner)
    {
        this._controller = controller || null;
        if (!this.HasDelayedBinding())
        {
            this.LinkDestination(controller, owner);
        }
        this.CompileExpression();
    }

    Start(controller, owner)
    {
        this._controller = controller || this._controller;
        owner = owner || (controller && controller.GetOwner ? controller.GetOwner() : null);

        if (this.HasDelayedBinding() || !this.IsBindingValid())
        {
            this.LinkDestination(controller, owner);
        }

        if (!this.IsBindingValid())
        {
            return false;
        }

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

        if (!this.IsBindingValid())
        {
            return;
        }

        const program = this.CompileExpression();
        if (!program.IsValid())
        {
            return;
        }

        const value = program.Evaluate(this.GetExpressionContext(controller, owner));
        this._bindingPoint.SetValue(value, controller, owner);
    }

    CompileExpression()
    {
        if (!this._program || this._programSource !== this.value)
        {
            this._program = Tr2ExpressionProgram.Compile(this.value, {
                emptyValue: 0,
                functions: {
                    Curve: (ctx, time) => this.GetCurveValue(time)
                }
            });
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

    GetCurveValue(time)
    {
        if (!this.curve)
        {
            return 0;
        }
        if (this.curve.GetValueAt)
        {
            return this.curve.GetValueAt(time);
        }
        if (this.curve.GetValue)
        {
            return this.curve.GetValue(time);
        }
        return this.curve.currentValue !== undefined ? this.curve.currentValue : 0;
    }

    HasDelayedBinding()
    {
        return !!(this.delayBinding && this.path);
    }

    IsExpressionValid()
    {
        return this.CompileExpression().IsValid();
    }

    GetBindingPoint()
    {
        if (!this._bindingPoint)
        {
            this._bindingPoint = new Tr2BindingPoint();
        }

        this._bindingPoint.path = this.path;
        this._bindingPoint.object = this.destination;
        this._bindingPoint.attribute = this.attribute;
        return this._bindingPoint;
    }

    LinkDestination(controllerOrRoots, owner)
    {
        return this.GetBindingPoint().Link(controllerOrRoots, owner);
    }

    Unlink()
    {
        if (this._bindingPoint)
        {
            this._bindingPoint.Unlink();
        }
        this._controller = null;
        this._program = null;
        this._programSource = null;
    }

    IsBindingValid()
    {
        return !!(this._bindingPoint && this._bindingPoint.IsValid());
    }

    GetDestination(controllerOrRoots, owner)
    {
        return this.GetBindingPoint().GetBoundObject(controllerOrRoots, owner);
    }
}
