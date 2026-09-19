import { meta } from "utils";
import { GetRangeDurationOn, GetCurveSetDurationOn } from "../../curve/curveSetOwner";


@meta.define("EveMultiEffect", true)
export class EveMultiEffect extends meta.Model
{

    @meta.string
    name = "";

    @meta.list("EveMultiEffectParameter")
    parameters = [];

    @meta.list("Tr2DynamicBinding")
    bindings = [];

    @meta.list("Tr2Controller")
    controllers = [];

    @meta.list("Tw2CurveSet")
    curveSets = [];

    @meta.notImplemented
    @meta.list("Tr2ExternalParameter")
    externalParameters = [];

    _initialized = false;

    Initialize()
    {
        for (let i = 0; i < this.parameters.length; i++)
        {
            this.parameters[i]?.SetOwner?.(this);
        }

        for (let i = 0; i < this.bindings.length; i++)
        {
            this.bindings[i]?.SetOwner?.(this);
        }

        this.Rebind();
        this._initialized = true;
        return true;
    }

    Rebind(onlyUpdateBindings = false)
    {
        for (let i = 0; i < this.bindings.length; i++)
        {
            const binding = this.bindings[i];
            if (!binding) continue;
            if (binding.SetOwner) binding.SetOwner(this);
            if (binding.Link) binding.Link();
            if (binding.Update) binding.Update(0);
        }

        if (onlyUpdateBindings) return;

        for (let i = 0; i < this.controllers.length; i++)
        {
            this.controllers[i]?.Link?.(this);
        }
    }

    SetParameter(parameterName, object)
    {
        const parameter = this.GetParameterByName(parameterName);
        if (!parameter) return false;
        parameter.SetParameterObject ? parameter.SetParameterObject(object) : parameter.object = object;
        this.Rebind();
        return true;
    }

    GetParameterByName(parameterName)
    {
        for (let i = 0; i < this.parameters.length; i++)
        {
            const parameter = this.parameters[i];
            if (parameter && parameter.name === parameterName) return parameter;
        }
        return null;
    }

    GetParameterMap()
    {
        const out = {};
        for (let i = 0; i < this.parameters.length; i++)
        {
            const parameter = this.parameters[i];
            if (!parameter || !parameter.name) continue;
            out[parameter.name] = parameter.GetParameterObject ? parameter.GetParameterObject() : parameter.object;
        }

        for (let i = 0; i < this.curveSets.length; i++)
        {
            const curveSet = this.curveSets[i];
            if (curveSet && curveSet.name) out[curveSet.name] = curveSet;
        }

        out.Owner = this;
        out.owner = this;
        return out;
    }

    GetBindingRoots(out = {})
    {
        Object.assign(out, this.GetParameterMap());
        return out;
    }

    SetControllerVariable(name, value)
    {
        let set = false;
        for (let i = 0; i < this.controllers.length; i++)
        {
            const controller = this.controllers[i];
            if (controller?.SetVariable?.(name, value)) set = true;
        }
        return set;
    }

    HandleControllerEvent(name)
    {
        let handled = false;
        for (let i = 0; i < this.controllers.length; i++)
        {
            const controller = this.controllers[i];
            if (controller?.HandleEvent?.(name)) handled = true;
        }
        return handled;
    }

    StartControllers()
    {
        if (!this._initialized) this.Initialize();
        for (let i = 0; i < this.controllers.length; i++)
        {
            this.controllers[i]?.Start?.();
        }
    }

    StopControllers()
    {
        for (let i = 0; i < this.controllers.length; i++)
        {
            this.controllers[i]?.Stop?.();
        }
    }

    PlayCurveSet(name, rangeName)
    {
        let played = false;
        for (let i = 0; i < this.curveSets.length; i++)
        {
            const curveSet = this.curveSets[i];
            if (!curveSet || curveSet.name !== name) continue;
            if (rangeName) curveSet.PlayTimeRange?.(rangeName);
            else
            {
                curveSet.ResetTimeRange?.();
                curveSet.Play?.();
            }
            played = true;
        }
        return played;
    }

    StopCurveSet(name)
    {
        let stopped = false;
        for (let i = 0; i < this.curveSets.length; i++)
        {
            const curveSet = this.curveSets[i];
            if (!curveSet || curveSet.name !== name) continue;
            curveSet.Stop?.();
            stopped = true;
        }
        return stopped;
    }

    UpdateCurveSet(name, time)
    {
        for (let i = 0; i < this.curveSets.length; i++)
        {
            const curveSet = this.curveSets[i];
            if (curveSet && curveSet.name === name) curveSet.Update?.(time);
        }
    }

    GetCurveSetDuration(name)
    {
        return GetCurveSetDurationOn(this, name);
    }

    GetRangeDuration(name, rangeName)
    {
        return GetRangeDurationOn(this, name, rangeName);
    }

    Update(dt = 0)
    {
        if (!this._initialized) this.Initialize();

        for (let i = 0; i < this.curveSets.length; i++)
        {
            this.curveSets[i]?.UpdateDelta?.(dt);
        }

        for (let i = 0; i < this.controllers.length; i++)
        {
            this.controllers[i]?.Update?.(dt, 0.5);
        }

        for (let i = 0; i < this.bindings.length; i++)
        {
            this.bindings[i]?.Update?.(dt);
        }
    }

    UpdateViewDependentData()
    {
    }

    UpdateLod()
    {
    }

    GetBatches()
    {
        return false;
    }

    GetLights()
    {
    }

    GetResources(out = [])
    {
        return out;
    }

}
