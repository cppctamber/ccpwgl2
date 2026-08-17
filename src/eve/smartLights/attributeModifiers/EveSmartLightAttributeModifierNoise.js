// Ported from CarbonEngine (MIT, (c) 2026 CCP Games) - https://github.com/carbonengine/trinity
//   trinity/trinity/Eve/SpaceObject/Children/SmartLightSets/attributeModifiers/EveSmartLightAttributeModifierNoise.h
import { meta } from "utils";
import { noise } from "math";
import { EveSmartLightBaseAttributeModifier } from "./EveSmartLightBaseAttributeModifier.js";


/** EveSmartLightAttributeModifierNoise (eve/smartLights/attributeModifiers) - generated from schema shapeHash 60b52eeb.... */
@meta.type("EveSmartLightAttributeModifierNoise")
@meta.ccp.define("EveSmartLightAttributeModifierNoise")
export class EveSmartLightAttributeModifierNoise extends EveSmartLightBaseAttributeModifier
{

    /** m_noiseAmplitude (float) [READWRITE, PERSIST] */
    @meta.float
    noiseAmplitude = 0;

    /** m_noiseFrequency (float) [READWRITE, PERSIST] */
    @meta.float
    noiseFrequency = 1;

    /** m_noiseOctaves (uint32_t) [READWRITE, PERSIST] */
    @meta.uint
    noiseOctaves = 1;

    /** Frame time captured per update; Carbon reads BeOS->GetCurrentFrameTime(). */
    _frameTime = 0;

    /**
     * Advances the crossfade state machine and captures the frame time for the
     * per-placement noise sample
     * (EveSmartLightAttributeModifierNoise.cpp:14-17). Carbon samples
     * BeOS->GetCurrentFrameTime() inside ProcessAttributeModifier; the frame
     * time is captured from the update context here because
     * ProcessAttributeModifier carries no context.
     */
    UpdateSyncronous(updateContext, _params, activationMultiplier)
    {
        this._frameTime = Number(updateContext?.GetTime?.() ?? updateContext?.currentTime ?? 0);
        this.UpdateActivationStrength(activationMultiplier, updateContext?.GetDeltaT?.() ?? 0);
    }

    /**
     * Scales the attribute by a Perlin-noise brightness pulse
     * (EveSmartLightAttributeModifierNoise.cpp:19-30). PerlinNoise1D(x, 2, 2, n)
     * maps to the shared noise.carbonPerlin1D port.
     */
    ProcessAttributeModifier(attribute, placement, _entityPosition, _entityDirection, modifierStrength)
    {
        const activationStrength = this.GetActivationStrength(placement) * modifierStrength;
        const activationAdjustedAmplitude = activationStrength * this.noiseAmplitude;

        if (activationAdjustedAmplitude > 0)
        {
            const sample = noise.carbonPerlin1D(this._frameTime * this.noiseFrequency, 2, 2, this.noiseOctaves);
            const noisifiedBrightness = ((sample + 1) / 2) * activationAdjustedAmplitude;
            const scale = 1 + activationStrength * (noisifiedBrightness - 1);
            attribute[0] *= scale;
            attribute[1] *= scale;
            attribute[2] *= scale;
        }
    }

}
