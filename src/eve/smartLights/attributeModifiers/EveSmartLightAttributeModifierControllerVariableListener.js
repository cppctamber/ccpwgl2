// Ported from CarbonEngine (MIT, (c) 2026 CCP Games) - https://github.com/carbonengine/trinity
//   trinity/trinity/Eve/SpaceObject/Children/SmartLightSets/attributeModifiers/EveSmartLightAttributeModifierControllerVariableListener.h
import { meta } from "utils";
import { EveSmartLightAttributeModifierBucket } from "./EveSmartLightAttributeModifierBucket.js";


/** EveSmartLightAttributeModifierControllerVariableListener (eve/smartLights/attributeModifiers) - generated from schema shapeHash 8438774e.... */
@meta.type("EveSmartLightAttributeModifierControllerVariableListener")
@meta.ccp.define("EveSmartLightAttributeModifierControllerVariableListener")
export class EveSmartLightAttributeModifierControllerVariableListener extends EveSmartLightAttributeModifierBucket
{

    /** m_variableName (std::string) [READWRITE, PERSIST] */
    @meta.string
    variableName = "";

    /** m_value (float) [READWRITE, PERSIST, NOTIFY] */
    @meta.float
    value = 0;

    /** m_invertReceivedValue (bool) [READWRITE, PERSIST, NOTIFY] */
    @meta.boolean
    invertReceivedValue = false;

    /** m_defaultValue (float) [READWRITE, PERSIST] */
    @meta.float
    defaultValue = 0;

    /** Last value/invert pair the settle hook applied (JS-only change detection). */
    _lastAppliedValue = 0;

    /** See _lastAppliedValue. */
    _lastAppliedInvert = false;

    /**
     * Seeds the listener from its default value before the base crossfade seed
     * (EveSmartLightAttributeModifierControllerVariableListener.cpp:15-21).
     */
    Initialize()
    {
        this.value = this.defaultValue;
        this.startsActive = this.defaultValue > 0.5;
        this.active = this.defaultValue > 0.5;
        this._lastAppliedValue = this.value;
        this._lastAppliedInvert = this.invertReceivedValue;
        return super.Initialize();
    }

    /**
     * Reapplies the activation state when the received value or the inversion
     * flag is edited, then defers to the base active-edit handling
     * (EveSmartLightAttributeModifierControllerVariableListener.cpp:23-39).
     *
     * The settle hook receives no changed-property list; value/invert edits are
     * detected by comparing cached last-applied values.
     */
    OnModified(options = {})
    {
        if (this.value !== this._lastAppliedValue || this.invertReceivedValue !== this._lastAppliedInvert)
        {
            this._lastAppliedValue = this.value;
            this._lastAppliedInvert = this.invertReceivedValue;
            this._ApplyValue();
        }

        return super.OnModified(options);
    }

    /**
     * Receives a controller variable: a name match updates the listener state,
     * and the value always fans out to the child modifiers
     * (EveSmartLightAttributeModifierControllerVariableListener.cpp:41-60).
     */
    SetControllerVariable(name, value)
    {
        if (this.variableName === name)
        {
            this.value = Number(value);
            this._lastAppliedValue = this.value;
            this._ApplyValue();
        }

        for (const modifier of this.attributeModifiers)
        {
            modifier?.SetControllerVariable?.(name, value);
        }
    }

    /** Shared value-to-activation mapping (cpp:27-35 and cpp:46-53 are identical). */
    _ApplyValue()
    {
        if (this.invertReceivedValue)
        {
            this.SetActive(this.value < 1);
        }
        else
        {
            this.SetActive(this.value > 0);
        }
    }

}
