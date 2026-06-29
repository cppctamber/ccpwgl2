import { meta } from "utils";
import { CallEmitter, FindSoundEmitter, GetOwner } from "./Tr2ActionAudioHelpers";
import { Tw2Action } from "./Tw2Action";


@meta.type("Tr2ActionSetAttenuationScaling")
@meta.ccp.define("Tr2ActionSetAttenuationScaling")
export class Tr2ActionSetAttenuationScaling extends Tw2Action
{
    @meta.string
    emitter = "";

    @meta.string
    controllerVariable = "";

    @meta.float
    scalingFactor = 1;

    @meta.private
    @meta.float
    finalScalingFactor = 1;

    _controller = null;

    Link(controller)
    {
        this._controller = controller || null;
    }

    Unlink()
    {
        this._controller = null;
    }

    Start(controller, owner)
    {
        this._controller = controller || this._controller;
        owner = GetOwner(controller, owner);
        this.finalScalingFactor = this.GetScalingFactor();

        const emitter = FindSoundEmitter(owner, this.emitter, controller);
        return CallEmitter(emitter, "SetAttenuationScalingFactor", [ this.finalScalingFactor ]);
    }

    StartWithController(controller)
    {
        return this.Start(controller);
    }

    GetScalingFactor()
    {
        const variableValue = this.GetControllerVariableValue();
        return variableValue !== 0 ? this.scalingFactor * variableValue : this.scalingFactor;
    }

    GetControllerVariableValue()
    {
        const controller = this._controller;
        if (!controller || !this.controllerVariable)
        {
            return 0;
        }

        if (controller.GetFloatVariableByName)
        {
            const variable = controller.GetFloatVariableByName(this.controllerVariable);
            if (variable !== undefined && variable !== null)
            {
                return typeof variable === "number" ? variable : variable.value;
            }
        }

        if (controller.GetVariableValue)
        {
            return controller.GetVariableValue(this.controllerVariable, 0);
        }

        return 0;
    }
}
