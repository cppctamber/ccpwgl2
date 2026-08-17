// Ported from CarbonEngine (MIT, (c) 2026 CCP Games) - https://github.com/carbonengine/trinity
//   trinity/trinity/Eve/SpaceObject/Children/SmartLightSets/attributeModifiers/EveSmartLightAttributeModifierColor.h
import { meta } from "utils";
import { vec4 } from "math";
import { EveSmartLightBaseAttributeModifier } from "./EveSmartLightBaseAttributeModifier.js";


/** EveSmartLightAttributeModifierColor (eve/smartLights/attributeModifiers) - generated from schema shapeHash 1d22dfd5.... */
@meta.type("EveSmartLightAttributeModifierColor")
@meta.ccp.define("EveSmartLightAttributeModifierColor")
export class EveSmartLightAttributeModifierColor extends EveSmartLightBaseAttributeModifier
{

    /** m_selectedColor (int32_t) [READWRITE, PERSIST, NOTIFY, ENUM] */
    @meta.int32
    factionColor = -1;

    /** m_blendValue (float) [READWRITE, PERSIST] */
    @meta.float
    blendValue = 1;

    /** m_useFactionColor (bool) [READWRITE, PERSIST] */
    @meta.boolean
    useFactionColor = false;

    /** m_blendColor (Color) [READWRITE, PERSIST] */
    @meta.color
    blendColor = vec4.fromValues(0, 0, 0, 1);

    /** m_brightnessMultiplier (float) [READWRITE, PERSIST] */
    @meta.float
    brightnessMultiplier = 1;

    /** m_saturationMultiplier (float) [READWRITE, PERSIST] */
    @meta.float
    saturationMultiplier = 1;

    /** m_parentColorSet (const Color*) - inherited faction color set, never persisted. */
    _parentColorSet = null;

    /** Stores the inherited faction color set (EveSmartLightAttributeModifierColor.cpp:18-24). */
    SetInheritProperties(colorSet)
    {
        if (colorSet)
        {
            this._parentColorSet = colorSet;
        }
    }

    /**
     * Resolves the blend color: the selected faction color when enabled and in
     * range, otherwise the authored blend color
     * (EveSmartLightAttributeModifierColor.cpp:26-36). Carbon's bound is
     * SOFDataFactionColorChooser::TYPE_MAX; the inherited JS color set is
     * exactly that array, so its length is the bound.
     */
    GetGroupColor()
    {
        if (this.useFactionColor && this._parentColorSet)
        {
            const index = this.factionColor | 0;
            if (index >= 0 && index < this._parentColorSet.length && this._parentColorSet[index])
            {
                return this._parentColorSet[index];
            }
        }
        return this.blendColor;
    }

    /** Advances the crossfade state machine (EveSmartLightAttributeModifierColor.cpp:38-41). */
    UpdateSyncronous(updateContext, _params, activationMultiplier)
    {
        this.UpdateActivationStrength(activationMultiplier, updateContext?.GetDeltaT?.() ?? 0);
    }

    /**
     * Blends the attribute color toward the group color, applies the
     * activation-scaled saturation and brightness multipliers, and clamps to
     * [0, 1] (EveSmartLightAttributeModifierColor.cpp:43-69). Component math
     * only - no allocation.
     */
    ProcessAttributeModifier(attribute, placement, _entityPosition, _entityDirection, modifierStrength)
    {
        const activationStrength = this.GetActivationStrength(placement) * modifierStrength;

        if (activationStrength <= 0)
        {
            return;
        }

        const activationAdjustedBrightnessMultiplier = 1 + activationStrength * (this.brightnessMultiplier - 1);
        const activationAdjustedBlendValue = activationStrength * this.blendValue;
        const activationAdjustedSaturationMultiplier = 1 + activationStrength * (this.saturationMultiplier - 1);

        const groupColor = this.GetGroupColor();
        let r = attribute[0] + (groupColor[0] - attribute[0]) * activationAdjustedBlendValue;
        let g = attribute[1] + (groupColor[1] - attribute[1]) * activationAdjustedBlendValue;
        let b = attribute[2] + (groupColor[2] - attribute[2]) * activationAdjustedBlendValue;

        if (activationAdjustedSaturationMultiplier !== 1)
        {
            // color intensity
            const i = r * 0.299 + g * 0.587 + b * 0.114;
            const saturation = Math.max(0, activationAdjustedSaturationMultiplier);
            r = i + (r - i) * saturation;
            g = i + (g - i) * saturation;
            b = i + (b - i) * saturation;
        }

        attribute[0] = Math.min(1, Math.max(0, r * activationAdjustedBrightnessMultiplier));
        attribute[1] = Math.min(1, Math.max(0, g * activationAdjustedBrightnessMultiplier));
        attribute[2] = Math.min(1, Math.max(0, b * activationAdjustedBrightnessMultiplier));
    }

}
