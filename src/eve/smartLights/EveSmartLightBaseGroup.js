// Ported from CarbonEngine (MIT, (c) 2026 CCP Games) - https://github.com/carbonengine/trinity
//   trinity/trinity/Eve/SpaceObject/Children/SmartLightSets/EveSmartLightBaseGroup.h
// Hand-maintained from Carbon source, promoted out of generated intake.
import { meta } from "utils";
import { vec4 } from "math";

/**
 * Faction-color resolution shared by every class that flattens Carbon's
 * EveSmartLightBaseGroup secondary base (EveSmartLightBaseGroup.cpp:43-53):
 * the selected faction color when enabled and in range, otherwise the custom
 * color. Carbon's bound is SOFDataFactionColorChooser::TYPE_MAX; the inherited
 * JS color set (EveChildInheritProperties.GetProperties()) is exactly that
 * array, so its length is the bound. Returns a live vec4 - callers read only.
 * @param {Float32Array} customColor
 * @param {Boolean} useFactionColor
 * @param {Number} factionColor
 * @param {Array|null} parentColorSet
 * @returns {Float32Array}
 */
export function resolveGroupColor(customColor, useFactionColor, factionColor, parentColorSet)
{
    if (useFactionColor && parentColorSet)
    {
        const index = factionColor | 0;
        if (index >= 0 && index < parentColorSet.length && parentColorSet[index])
        {
            return parentColorSet[index];
        }
    }
    return customColor;
}

/** The shared faction-colour resolution and attribute-modifier surface flattened into every smart-light group implementation. */
@meta.type("EveSmartLightBaseGroup")
@meta.ccp.define("EveSmartLightBaseGroup")
export class EveSmartLightBaseGroup extends meta.Model
{

    /** m_selectedColor (int32_t) [READWRITE, PERSIST, NOTIFY, ENUM] */
    @meta.int32
    factionColor = -1;

    /** m_useFactionColor (bool) [READWRITE, PERSIST] */
    @meta.boolean
    useFactionColor = false;

    /** m_attributeModifiers (PIEveSmartLightGroupAttributeModifierVector) [READ, PERSIST] */
    @meta.list("IEveSmartLightGroupAttributeModifier")
    attributeModifiers = [];

    /** m_color (Color) [READWRITE, PERSIST] */
    @meta.color
    customColor = vec4.createLinear();

    /** m_parentColorSet (const Color*) - inherited faction color set, never persisted. */
    _parentColorSet = null;

    /** Faction-aware group color (EveSmartLightBaseGroup.cpp:43-53). */
    GetGroupColor()
    {
        return resolveGroupColor(this.customColor, this.useFactionColor, this.factionColor, this._parentColorSet);
    }

    /**
     * Stores the inherited faction color set and fans it out to the attribute
     * modifiers (EveSmartLightBaseGroup.cpp:30-41).
     */
    SetInheritProperties(colorSet)
    {
        if (colorSet)
        {
            this._parentColorSet = colorSet;
        }

        for (const attributeModifier of this.attributeModifiers)
        {
            attributeModifier?.SetInheritProperties?.(colorSet);
        }
    }

    /** Overwrites the custom color (EveSmartLightBaseGroup.cpp:55-58). */
    SetColor(color)
    {
        vec4.copy(this.customColor, color);
    }

    /** Fans a controller variable out to the attribute modifiers (EveSmartLightBaseGroup.cpp:60-66). */
    SetControllerVariable(name, value)
    {
        for (const attributeModifier of this.attributeModifiers)
        {
            attributeModifier?.SetControllerVariable?.(name, value);
        }
    }

    /**
     * Newly inserted attribute modifiers inherit the parent color set
     * (EveSmartLightBaseGroup.cpp:16-28).
     *
     * List events carry no BELIST insert mask; the inserted value (or, absent
     * one, the whole list) is re-fanned - SetInheritProperties is idempotent.
     */
    OnListModified(_event, _key, _key2, value, list)
    {
        if (list === this.attributeModifiers && this._parentColorSet)
        {
            if (value)
            {
                value.SetInheritProperties?.(this._parentColorSet);
            }
            else
            {
                for (const attributeModifier of this.attributeModifiers)
                {
                    attributeModifier?.SetInheritProperties?.(this._parentColorSet);
                }
            }
        }
    }

}
