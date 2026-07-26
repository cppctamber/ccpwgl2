import { meta } from "utils";
import { Tw2Action } from "./Tw2Action";


@meta.type("Tr2ActionPlayCurveSet")
@meta.ccp.define("Tr2ActionPlayCurveSet")
export class Tr2ActionPlayCurveSet extends Tw2Action
{

    @meta.string
    curveSetName = "";

    @meta.string
    rangeName = "";

    @meta.boolean
    syncToRange = false;

    _startTime = 0;

    _prevTime = 0;

    _duration = 0;

    Start(controller, owner)
    {
        owner = owner || (controller && controller.GetOwner ? controller.GetOwner() : null);
        this._duration = 0;

        if (!this.Play(owner))
        {
            return false;
        }

        if (this.syncToRange && this.rangeName)
        {
            this._duration = this.GetRangeDuration(owner);
            this._startTime = controller && controller.GetTime ? controller.GetTime() : 0;
            this._prevTime = this._startTime;

            if (this._duration > 0 && controller && controller.RegisterUpdateable)
            {
                controller.RegisterUpdateable(this);
            }
        }

        return true;
    }

    Stop(controller, owner)
    {
        if (controller && controller.UnRegisterUpdateable)
        {
            controller.UnRegisterUpdateable(this);
        }

        owner = owner || (controller && controller.GetOwner ? controller.GetOwner() : null);
        if (owner && owner.StopCurveSet)
        {
            owner.StopCurveSet(this.curveSetName);
            return true;
        }

        const curveSet = this.FindCurveSet(owner);
        if (curveSet && curveSet.Stop)
        {
            curveSet.Stop();
            return true;
        }

        return false;
    }

    RebaseSimTime(diff)
    {
        this._startTime += diff;
        this._prevTime += diff;
    }

    CanTransition(controller)
    {
        if (!this.syncToRange || this._duration <= 0)
        {
            return true;
        }

        const now = controller && controller.GetTime ? controller.GetTime() : this._prevTime;
        if (now === this._startTime)
        {
            return true;
        }

        const prevIteration = Math.floor((this._prevTime - this._startTime) / this._duration);
        const iteration = Math.floor((now - this._startTime) / this._duration);
        if (iteration !== prevIteration)
        {
            this._prevTime = now;
            return true;
        }

        return false;
    }

    Update(dt, controller)
    {
        this._prevTime = controller && controller.GetTime ? controller.GetTime() : this._prevTime + dt;
    }

    Play(owner)
    {
        if (owner && owner.PlayCurveSet)
        {
            return owner.PlayCurveSet(this.curveSetName, this.rangeName);
        }

        const curveSet = this.FindCurveSet(owner);
        if (!curveSet)
        {
            return false;
        }

        if (this.rangeName && curveSet.PlayTimeRange)
        {
            return curveSet.PlayTimeRange(this.rangeName);
        }

        if (curveSet.Play)
        {
            curveSet.Play();
            return true;
        }

        return false;
    }

    GetRangeDuration(owner)
    {
        if (owner && owner.GetRangeDuration)
        {
            return owner.GetRangeDuration(this.curveSetName, this.rangeName);
        }

        const curveSet = this.FindCurveSet(owner);
        return curveSet && curveSet.GetRangeDuration ? curveSet.GetRangeDuration(this.rangeName) : 0;
    }

    FindCurveSet(owner)
    {
        if (!owner)
        {
            return null;
        }

        if (owner.FindCurveSet)
        {
            return owner.FindCurveSet(this.curveSetName);
        }

        const curveSets = owner.curveSets;
        if (!curveSets)
        {
            return null;
        }

        for (let i = 0; i < curveSets.length; i++)
        {
            if (curveSets[i] && curveSets[i].name === this.curveSetName)
            {
                return curveSets[i];
            }
        }

        return null;
    }

}
