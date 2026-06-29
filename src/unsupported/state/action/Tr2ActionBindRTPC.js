import { meta } from "utils";
import { CallEmitter, FindSoundEmitter, GetOwner } from "./Tr2ActionAudioHelpers";
import { Tw2Action } from "./Tw2Action";


@meta.notImplemented
@meta.type("Tr2ActionBindRTPC")
@meta.ccp.define("Tr2ActionBindRTPC")
export class Tr2ActionBindRTPC extends Tw2Action
{

    @meta.string
    value = "";

    @meta.string
    emitter = "";

    @meta.string
    rtpcName = "";

    @meta.struct()
    curve = null;

    _controller = null;

    _emitter = null;

    _startTime = 0;

    _lastTime = 0;

    Link(controller)
    {
        this._controller = controller || null;
    }

    Unlink()
    {
        if (this._controller && this._controller.UnRegisterUpdateable)
        {
            this._controller.UnRegisterUpdateable(this);
        }

        this._controller = null;
        this._emitter = null;
    }

    Start(controller, owner)
    {
        this._controller = controller || this._controller;
        owner = GetOwner(this._controller, owner);
        this._startTime = this._controller && this._controller.GetTime ? this._controller.GetTime() : 0;
        this._lastTime = this._startTime;
        this._emitter = FindSoundEmitter(owner, this.emitter, this._controller);

        if (this._controller && this._controller.RegisterUpdateable)
        {
            this._controller.RegisterUpdateable(this);
        }

        return !!this._emitter;
    }

    StartWithController(controller)
    {
        return this.Start(controller);
    }

    Stop(controller)
    {
        controller = controller || this._controller;
        if (controller && controller.UnRegisterUpdateable)
        {
            controller.UnRegisterUpdateable(this);
        }

        return true;
    }

    StopWithController(controller)
    {
        return this.Stop(controller);
    }

    RebaseSimTime(diff)
    {
        this._startTime += diff;
        this._lastTime += diff;
    }

    Update(dt, controller, owner)
    {
        controller = controller || this._controller;
        owner = GetOwner(controller, owner);
        this._lastTime = controller && controller.GetTime ? controller.GetTime() : this._lastTime + dt;

        if (!this._emitter)
        {
            this._emitter = FindSoundEmitter(owner, this.emitter, controller);
        }

        // Carbon evaluates a controller expression and sends it to an audio RTPC.
        // ccpwgl has no audio backend contract here, so this only calls a duck-typed hook.
        return CallEmitter(this._emitter, "SetRTPC", [ this.rtpcName, this.EvaluateValue(controller, owner) ]);
    }

    EvaluateValue(controller, owner)
    {
        const numeric = Number(this.value);
        if (!Number.isNaN(numeric))
        {
            return numeric;
        }

        if (this.value === "StateTime()")
        {
            return this._lastTime - this._startTime;
        }

        return this.GetCurveValue(this._lastTime - this._startTime);
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

    IsExpressionValid()
    {
        return true;
    }

    IsAttrExpressionValid()
    {
        return this.IsExpressionValid();
    }

    EvaluateExpression(expression)
    {
        const value = Number(expression);
        return Number.isNaN(value) ? 0 : value;
    }

    GetExpressionTermInfo()
    {
        return [];
    }
}
