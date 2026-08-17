// Ported from CarbonEngine (MIT, (c) 2026 CCP Games) - https://github.com/carbonengine/trinity
//   trinity/trinity/Eve/SpaceObject/Children/SmartLightSets/attributeModifiers/EveSmartLightAttributeModifierCameraDependency.h
import { meta } from "utils";
import { vec3 } from "math";
import { EveSmartLightAttributeModifierBucket } from "./EveSmartLightAttributeModifierBucket.js";


/** EveSmartLightAttributeModifierCameraDependency (eve/smartLights/attributeModifiers) - generated from schema shapeHash 5e9c1bd9.... */
@meta.type("EveSmartLightAttributeModifierCameraDependency")
@meta.ccp.define("EveSmartLightAttributeModifierCameraDependency")
export class EveSmartLightAttributeModifierCameraDependency extends EveSmartLightAttributeModifierBucket
{

    /** m_minimumDistance (float) [READWRITE, PERSIST] */
    @meta.float
    minimumDistance = 1000;

    /** m_maximumDistance (float) [READWRITE, PERSIST] */
    @meta.float
    maximumDistance = 10000;

    /** m_lookAtVisionCone (float) [READWRITE, PERSIST] */
    @meta.float
    lookAtVisionCone = 30;

    /** m_useCameraDistance (bool) [READWRITE, PERSIST] */
    @meta.boolean
    useCameraDistance = false;

    /** m_inverselookAtFormula (bool) [READWRITE, PERSIST] */
    @meta.boolean
    inverselookAtFormula = false;

    /** m_useCameraLookAt (bool) [READWRITE, PERSIST] */
    @meta.boolean
    useCameraLookAt = false;

    /** m_inverseDistanceFormula (bool) [READWRITE, PERSIST] */
    @meta.boolean
    inverseDistanceFormula = false;

    /** m_useCameraPlacement (bool) [READWRITE, PERSIST] */
    @meta.boolean
    useCameraPlacement = false;

    /** m_inversePlacementFormula (bool) [READWRITE, PERSIST] */
    @meta.boolean
    inversePlacementFormula = false;

    /** m_angleOverwrite (Vector3) [READWRITE, PERSIST] */
    @meta.vector3
    angleOverwrite = vec3.create();

    /** m_positionOverwrite (Vector3) [READWRITE, PERSIST] */
    @meta.vector3
    positionOverwrite = vec3.create();

    /** m_lookAtIntencity (float) [READWRITE, PERSIST] */
    @meta.float
    lookAtIntensity = 1;

    /** m_placementIntencity (float) [READWRITE, PERSIST] */
    @meta.float
    placementIntensity = 1;

    /** m_overwriteDirection (bool) [READWRITE, PERSIST] */
    @meta.boolean
    overwriteObjectDirection = false;

    /** m_overwritePosition (bool) [READWRITE, PERSIST] */
    @meta.boolean
    overwritePosition = false;

    /** m_maximumActivation (float) [READWRITE, PERSIST] */
    @meta.float
    maximumActivation = 1;

    /** m_minimumActivation (float) [READWRITE, PERSIST] */
    @meta.float
    minimumActivation = 0;

    /** Camera state source captured per update; Carbon reads Tr2Renderer statics. */
    _renderContext = null;

    /**
     * Advances only this modifier's crossfade - Carbon deliberately does NOT
     * update the child modifiers here
     * (EveSmartLightAttributeModifierCameraDependency.cpp:31-34). Carbon reads
     * Tr2Renderer view statics; the relocated camera state is captured from the
     * update context's render context here because ProcessAttributeModifier
     * carries no context.
     */
    UpdateSyncronous(updateContext, _params, activationMultiplier)
    {
        this._renderContext = updateContext?.renderContext ?? null;
        this.UpdateActivationStrength(activationMultiplier, updateContext?.GetDeltaT?.() ?? 0);
    }

    /**
     * Scales the child modifiers by the camera-dependent activation value
     * (EveSmartLightAttributeModifierCameraDependency.cpp:106-117).
     */
    ProcessAttributeModifier(attribute, placement, entityPosition, entityDirection, modifierStrength)
    {
        const activationValue = this._GetActivationValue(entityPosition, entityDirection);

        if (activationValue !== 0)
        {
            const childStrength = activationValue * modifierStrength * this.attributeMultiplier;
            for (const attributeModifier of this.attributeModifiers)
            {
                attributeModifier?.ProcessAttributeModifier?.(attribute, placement, entityPosition, entityDirection, childStrength);
            }
        }
    }

    /**
     * Product of the enabled camera amplitudes, remapped into the
     * [minimumActivation, maximumActivation] range
     * (EveSmartLightAttributeModifierCameraDependency.cpp:95-104).
     */
    _GetActivationValue(objectPosition, entityDirection)
    {
        const camPos = this._renderContext?.GetViewPosition?.() ?? EveSmartLightAttributeModifierCameraDependency._zero;
        const vec2obj = EveSmartLightAttributeModifierCameraDependency._vec2obj;
        if (this.overwritePosition)
        {
            vec3.subtract(vec2obj, this.positionOverwrite, camPos);
        }
        else
        {
            vec3.subtract(vec2obj, objectPosition, camPos);
        }

        let activationValue = 1;
        activationValue *= this._GetDistanceAmplitude(vec2obj);
        activationValue *= this._GetLookAtAmplitude(vec2obj);
        activationValue *= this._GetPlacementAmplitude(vec2obj, entityDirection);
        return this.minimumActivation + (this.maximumActivation - this.minimumActivation) * activationValue;
    }

    /** Normalized camera-distance ramp (EveSmartLightAttributeModifierCameraDependency.cpp:36-50). */
    _GetDistanceAmplitude(vec2obj)
    {
        if (!this.useCameraDistance)
        {
            return 1;
        }
        const distance = vec3.length(vec2obj);
        let distanceAmplitude = Math.min(1, Math.max(0, (distance - this.minimumDistance) / (this.maximumDistance - this.minimumDistance)));
        if (this.inverseDistanceFormula)
        {
            distanceAmplitude = 1 - distanceAmplitude;
        }
        return distanceAmplitude;
    }

    /**
     * Camera look-at cone amplitude
     * (EveSmartLightAttributeModifierCameraDependency.cpp:52-72). Carbon's
     * Tr2Renderer::GetViewLookAt() is the view matrix column (_13,_23,_33),
     * which on the shared byte layout is view[2], view[6], view[10].
     */
    _GetLookAtAmplitude(vec2obj)
    {
        if (!this.useCameraLookAt)
        {
            return 1;
        }
        const view = this._renderContext?.GetViewTransform?.();
        if (!view)
        {
            return 1;
        }
        const scratch = EveSmartLightAttributeModifierCameraDependency._normalized;
        vec3.normalize(scratch, vec2obj);
        let lookAtAmplitude = -(view[2] * scratch[0] + view[6] * scratch[1] + view[10] * scratch[2]);
        if (this.lookAtVisionCone < 90 && this.lookAtVisionCone > 0)
        {
            const startValue = (90 - this.lookAtVisionCone) / 90;
            lookAtAmplitude = Math.max(lookAtAmplitude - startValue, 0) / (1 - startValue);
        }

        lookAtAmplitude = Math.pow(lookAtAmplitude, this.lookAtIntensity);

        if (this.inverselookAtFormula)
        {
            lookAtAmplitude = 1 - lookAtAmplitude;
        }
        return lookAtAmplitude;
    }

    /** Entity-facing amplitude (EveSmartLightAttributeModifierCameraDependency.cpp:74-93). */
    _GetPlacementAmplitude(vec2obj, entityDirection)
    {
        if (!this.useCameraPlacement)
        {
            return 1;
        }
        const statics = EveSmartLightAttributeModifierCameraDependency;
        let eDir = entityDirection;
        if (this.overwriteObjectDirection)
        {
            eDir = vec3.normalize(statics._direction, this.angleOverwrite);
        }
        const scratch = statics._normalized;
        vec3.normalize(scratch, vec2obj);
        let placementAmplitude = Math.max(0, -vec3.dot(scratch, eDir));

        if (this.placementIntensity !== 1)
        {
            placementAmplitude = Math.pow(placementAmplitude, this.placementIntensity);
        }

        if (this.inversePlacementFormula)
        {
            placementAmplitude = 1 - placementAmplitude;
        }
        return placementAmplitude;
    }

    static _zero = vec3.create();

    static _vec2obj = vec3.create();

    static _normalized = vec3.create();

    static _direction = vec3.create();

}
