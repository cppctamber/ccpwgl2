import { isString, meta } from "utils";
import { tw2 } from "global";
import { EveMultiEffect } from "eve/effect";


@meta.define("TnyMultiEffect")
export class TnyMultiEffect extends meta.Model
{

    @meta.struct()
    wrapped = null;

    @meta.plain
    custom = {};

    get isBackgroundObject()
    {
        return true;
    }

    constructor(wrapped, values)
    {
        super();
        if (wrapped) this.SetWrapped(wrapped);
        if (values) this.SetValues(values);
    }

    SetWrapped(wrapped)
    {
        if (wrapped && !(wrapped instanceof EveMultiEffect))
        {
            throw new TypeError("Invalid wrapped multi effect");
        }
        this.wrapped = wrapped || null;
        return this;
    }

    SetParameter(name, object)
    {
        this.wrapped?.SetParameter?.(name, object?.wrapped || object || null);
        return this;
    }

    SetParameters(parameters = {})
    {
        for (const key in parameters)
        {
            if (Object.prototype.hasOwnProperty.call(parameters, key))
            {
                this.SetParameter(key, parameters[key]);
            }
        }
        return this;
    }

    SetControllerVariable(name, value)
    {
        this.wrapped?.SetControllerVariable?.(name, value);
        return this;
    }

    SetControllerVariables(variables = {})
    {
        for (const key in variables)
        {
            if (Object.prototype.hasOwnProperty.call(variables, key))
            {
                this.SetControllerVariable(key, variables[key]);
            }
        }
        return this;
    }

    StartControllers()
    {
        this.wrapped?.StartControllers?.();
        return this;
    }

    StopControllers()
    {
        this.wrapped?.StopControllers?.();
        return this;
    }

    HandleControllerEvent(name)
    {
        this.wrapped?.HandleControllerEvent?.(name);
        return this;
    }

    Rebind(onlyUpdateBindings)
    {
        this.wrapped?.Rebind?.(onlyUpdateBindings);
        return this;
    }

    Update(dt)
    {
        this.EmitEvent("update", this, dt);
        return true;
    }

    GetResources(out = [])
    {
        return this.wrapped?.GetResources?.(out) || out;
    }

    static async fetch(options = {})
    {
        if (isString(options)) options = { resPath: options };

        const { resPath, parameters, controllerVariables, autoStart = false, ...values } = options;
        if (!resPath) throw new ReferenceError("Could not identify resource path");

        const wrapped = await tw2.Fetch(resPath.replace(/\.red$/i, ".black"));
        const multiEffect = new this(wrapped, values);

        if (parameters) multiEffect.SetParameters(parameters);
        if (controllerVariables) multiEffect.SetControllerVariables(controllerVariables);
        if (autoStart) multiEffect.StartControllers();

        return multiEffect;
    }

    static fromWrapped(wrapped, values)
    {
        return new this(wrapped, values);
    }

    static getWrapped(item)
    {
        return item ? item.wrapped || null : null;
    }

    static hasWrapped(item)
    {
        return !!this.getWrapped(item);
    }

    static clearWrapped(item)
    {
        if (item?.SetWrapped) item.SetWrapped(null);
        return item;
    }

}
