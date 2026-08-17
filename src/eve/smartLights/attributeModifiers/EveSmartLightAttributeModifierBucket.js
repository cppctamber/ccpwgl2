// Ported from CarbonEngine (MIT, (c) 2026 CCP Games) - https://github.com/carbonengine/trinity
//   trinity/trinity/Eve/SpaceObject/Children/SmartLightSets/attributeModifiers/EveSmartLightAttributeModifierBucket.h
import { meta } from "utils";
import { EveSmartLightBaseAttributeModifier } from "./EveSmartLightBaseAttributeModifier.js";


/** EveSmartLightAttributeModifierBucket (eve/smartLights/attributeModifiers) - generated from schema shapeHash cade668b.... */
@meta.type("EveSmartLightAttributeModifierBucket")
@meta.ccp.define("EveSmartLightAttributeModifierBucket")
export class EveSmartLightAttributeModifierBucket extends EveSmartLightBaseAttributeModifier
{

    /** m_attributeModifiers (PIEveSmartLightGroupAttributeModifierVector) [READ, PERSIST, NOTIFY] */
    @meta.list("IEveSmartLightGroupAttributeModifier")
    attributeModifiers = [];

    /** m_name (std::string) [READWRITE, PERSIST] */
    @meta.string
    name = "bucket";

    /**
     * Toggles the bucket, resetting the children only on an actual state change
     * (EveSmartLightAttributeModifierBucket.cpp:13-21).
     */
    SetActive(isActive)
    {
        this.isChangingActivation = isActive !== this.active;
        if (this.isChangingActivation)
        {
            this.ResetPlayTime(isActive);
        }
        this.active = isActive;
        this.lastAppliedActive = isActive;
    }

    /**
     * Bucket override: resetting play time cascades to the children instead of
     * touching the bucket's own timers
     * (EveSmartLightAttributeModifierBucket.cpp:23-26).
     */
    ResetPlayTime(active)
    {
        this.ResetChildren(active);
    }

    /** Fans the inherited color set out to the child modifiers (EveSmartLightAttributeModifierBucket.cpp:28-34). */
    SetInheritProperties(colorSet)
    {
        for (const attributeModifier of this.attributeModifiers)
        {
            attributeModifier?.SetInheritProperties?.(colorSet);
        }
    }

    /**
     * Advances the bucket's crossfade, then updates the children with the
     * compounded multiplier (EveSmartLightAttributeModifierBucket.cpp:36-45).
     */
    UpdateSyncronous(updateContext, params, activationMultiplier)
    {
        this.UpdateActivationStrength(activationMultiplier, updateContext?.GetDeltaT?.() ?? 0);
        const childMultiplier = activationMultiplier * this.finalAttributeMultiplier;

        for (const attributeModifier of this.attributeModifiers)
        {
            attributeModifier?.UpdateSyncronous?.(updateContext, params, childMultiplier);
        }
    }

    /**
     * Runs the child modifiers with the bucket's per-placement activation
     * strength folded in (EveSmartLightAttributeModifierBucket.cpp:47-55).
     */
    ProcessAttributeModifier(attribute, placement, entityPosition, entityDirection, modifierStrength)
    {
        const activationStrength = this.GetActivationStrength(placement) * modifierStrength;

        for (const attributeModifier of this.attributeModifiers)
        {
            attributeModifier?.ProcessAttributeModifier?.(attribute, placement, entityPosition, entityDirection, activationStrength);
        }
    }

    /**
     * Resets every child's play time; a child only becomes active when both the
     * parent request and the bucket state agree
     * (EveSmartLightAttributeModifierBucket.cpp:57-67). Carbon BlueCasts to
     * EveSmartLightBaseAttributeModifier; the JS children are duck-typed.
     */
    ResetChildren(parentActive = true)
    {
        const isActive = parentActive && this.active;
        for (const attributeModifier of this.attributeModifiers)
        {
            attributeModifier?.ResetPlayTime?.(isActive);
        }
    }

}
