// Ported from CarbonEngine (MIT, (c) 2026 CCP Games) - https://github.com/carbonengine/trinity
//   trinity/trinity/Eve/SpaceObject/Children/SmartLightSets/attributeModifiers/EveSmartLightAttributeModifierColor.h
import { meta } from "utils";
import { vec4 } from "math";
import { EveSmartLightBaseAttributeModifier } from "./EveSmartLightBaseAttributeModifier.js";
import { resolveGroupColor } from "../EveSmartLightBaseGroup";


/** EveSmartLightAttributeModifierColor (eve/smartLights/attributeModifiers) - generated from schema shapeHash 1d22dfd5.... */
@meta.type("EveSmartLightAttributeModifierColor")
@meta.ccp.define("EveSmartLightAttributeModifierColor")
export class EveSmartLightAttributeModifierColor extends EveSmartLightBaseAttributeModifier
{

    /**
     * m_name (std::string) [READWRITE, PERSIST] - "organize your buckets".
     *
     * Mapped in this class's own exposure rather than inherited: Carbon's
     * EveSmartLightBaseAttributeModifier does not map a name, so each concrete
     * modifier that wants one declares it. Without it the reader throws
     * `Unknown property "name"` and takes the whole .black down.
     */
    @meta.string
    name = "";

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

    /** Scratch for a resolved faction colour; read immediately, never retained. */
    _resolvedGroupColor = vec4.create();

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
     * (EveSmartLightAttributeModifierColor.cpp:26-36).
     *
     * This is the same lookup the groups do, and it had the same defect: the
     * inherited set is an `EveSOFDataFactionColorSet` with NAMED fields, not the
     * raw `Color[TYPE_MAX]` Carbon indexes, so `index < undefined` was always
     * false and this always returned `blendColor`.
     *
     * It matters more here than anywhere else. `blendColor` is the authored
     * OVERRIDE, and Carbon never reads it while `useFactionColor` is set - so
     * nothing constrains what an artist leaves in it. On
     * amarr_primaryspotlight_01a the speed-driven modifier carries
     * `useFactionColor = true`, `factionColor = 37` (SecondarySpotlight) and a
     * leftover `blendColor` of (1, 0, 0.699): magenta. Blending that in at full
     * strength and multiplying by brightness 2 clamps to (1, 0, 1) - which is
     * the pink the lights turned when the ship got up to speed.
     */
    GetGroupColor()
    {
        return resolveGroupColor(this.blendColor, this.useFactionColor, this.factionColor, this._parentColorSet, this._resolvedGroupColor);
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
