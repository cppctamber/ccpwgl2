// Ported from CarbonEngine (MIT, (c) 2026 CCP Games) - https://github.com/carbonengine/trinity
//   trinity/trinity/Eve/SpaceObject/Children/SmartLightSets/attributeModifiers/EveSmartLightBaseAttributeModifier.h
import { meta } from "utils";
import { LifeTimeFormulas } from "./enums.js";


/** EveSmartLightBaseAttributeModifier (eve/smartLights/attributeModifiers) - generated from schema shapeHash d70f7c45.... */
@meta.type("EveSmartLightBaseAttributeModifier")
@meta.ccp.define("EveSmartLightBaseAttributeModifier")
export class EveSmartLightBaseAttributeModifier extends meta.Model
{

    /** m_lifeTimeFormula (LifeTimeFormulas - enum LifeTimeFormulas) [READWRITE, PERSIST, ENUM] */
    @meta.int32
    @meta.enums(LifeTimeFormulas)
    lifeTimeFormula = 0;

    /** m_activationOverLifetime (Tr2CurveScalarPtr) [READWRITE, PERSIST] */
    @meta.struct("Tr2CurveScalar")
    activationOverLifetime = null;

    /** m_activationValue (float) [READ] */
    @meta.float
    activationValue = 1;

    /** m_playTime (float) [READ] */
    @meta.float
    playTime = 0;

    /** m_crossFadeDuration (float) [READWRITE, PERSIST] */
    @meta.float
    crossFadeDuration = 1;

    /** m_crossFadeIntensity (float) [READWRITE, PERSIST] */
    @meta.float
    crossFadeIntensity = 1;

    /** m_perInstanceOffset (float) [READWRITE, PERSIST] */
    @meta.float
    perInstanceOffset = 0;

    /** m_activationStrength (float) [READWRITE, PERSIST] */
    @meta.float
    attributeMultiplier = 1;

    /** m_startsActive (bool) [READWRITE, PERSIST] */
    @meta.boolean
    startsActive = true;

    /** m_restartPlayTimeWhenInactive (bool) [READWRITE, PERSIST] */
    @meta.boolean
    restartPlayTimeWhenInactive = true;

    /** m_finalActivationStrength (float) [READ] */
    @meta.float
    finalAttributeMultiplier = 1;

    /** m_active (bool) [READWRITE, PERSIST, NOTIFY] */
    @meta.boolean
    active = true;

    /** m_delayedActivation (float) [READWRITE, PERSIST] */
    @meta.float
    delayedActivation = 0;

    // Carbon-protected crossfade state (EveSmartLightBaseAttributeModifier.h:47-60).
    // isChangingActivation and lastAppliedActive stay plain runtime fields because
    // subclasses write them (EveSmartLightAttributeModifierBucket::SetActive);
    // the rest is private.

    /** m_isChangingActivation (bool) - crossfade in progress (EveSmartLightBaseAttributeModifier.h:49). */
    isChangingActivation = false;

    /** Last `active` value applied by an edit path (JS-only change detection for the settle hook). */
    lastAppliedActive = true;

    /** m_activationValuePreMapped (float) - linear crossfade position before intensity mapping (h:57). */
    _activationValuePreMapped = 1;

    /** m_lastActivationTimeStamp (float) - playTime captured on the last (de)activation (h:60). */
    _lastActivationTimeStamp = 0;

    /**
     * Seeds the crossfade state machine: a modifier authored active but not
     * starting active animates into its active state
     * (EveSmartLightBaseAttributeModifier.cpp:27-33).
     */
    Initialize()
    {
        this.isChangingActivation = this.active && !this.startsActive;
        this._activationValuePreMapped = this.isChangingActivation ? 0 : (this.active ? 1 : 0);
        this.MapActivationValue();
        this.lastAppliedActive = this.active;
        return true;
    }

    /**
     * Reacts to an `active` edit by restarting the crossfade from the current
     * (unmapped) position (EveSmartLightBaseAttributeModifier.cpp:35-48).
     *
     * The settle hook receives no changed-property list; the active edit is
     * detected by comparing the cached last-applied value.
     */
    OnModified(_options = {})
    {
        if (this.active !== this.lastAppliedActive)
        {
            this.lastAppliedActive = this.active;
            this.isChangingActivation = true;
            if (this.crossFadeIntensity > 0)
            {
                this._activationValuePreMapped = Math.pow(this._activationValuePreMapped, 1 / this.crossFadeIntensity);
            }
            this.ResetPlayTime(this.active);
        }
        return true;
    }

    /**
     * Applies an activation state, optionally restarting the play time
     * (EveSmartLightBaseAttributeModifier.cpp:50-63).
     */
    ResetPlayTime(active)
    {
        if (active !== this.active)
        {
            this.isChangingActivation = true;
        }

        this.active = active;
        this.lastAppliedActive = this.active;
        if (this.restartPlayTimeWhenInactive && !this.active)
        {
            this.playTime = 0;
        }
        this._lastActivationTimeStamp = this.playTime;
    }

    /**
     * Maps the linear crossfade position through the intensity power curve,
     * mirrored around the deactivating direction
     * (EveSmartLightBaseAttributeModifier.cpp:65-70).
     */
    MapActivationValue()
    {
        const scaleValue = this.active ? this._activationValuePreMapped : 1 - this._activationValuePreMapped;
        const mapped = Math.pow(scaleValue, this.crossFadeIntensity);
        this.activationValue = this.active ? mapped : 1 - mapped;
    }

    /**
     * Advances the crossfade/delayed-activation state machine and folds the
     * parent multiplier into the final activation strength
     * (EveSmartLightBaseAttributeModifier.cpp:72-125).
     */
    UpdateActivationStrength(parentActivationMultiplier, deltaTime)
    {
        if (this.isChangingActivation)
        {
            const activationTime = this._lastActivationTimeStamp + this.delayedActivation;
            if (this.playTime < activationTime && this.active)
            {
                if (parentActivationMultiplier > 0)
                {
                    this.playTime += deltaTime;
                }
                return;
            }

            if (this.crossFadeDuration === 0)
            {
                this._activationValuePreMapped = this.active ? 1 : 0;
            }
            else
            {
                let valueAdjustment = deltaTime / this.crossFadeDuration;
                valueAdjustment = this.active ? valueAdjustment : -valueAdjustment;
                this._activationValuePreMapped = Math.min(1, Math.max(0, this._activationValuePreMapped + valueAdjustment));
            }

            this.MapActivationValue();

            const finishedActivating = this.active && this._activationValuePreMapped >= 1;
            const finishedDeActivating = !this.active && this._activationValuePreMapped <= 0;

            if (finishedActivating || finishedDeActivating)
            {
                this.isChangingActivation = false;
                if (finishedDeActivating && this.restartPlayTimeWhenInactive)
                {
                    this.ResetChildren(false);
                }
                if (finishedActivating)
                {
                    this.ResetChildren(true);
                }
            }
        }

        this.finalAttributeMultiplier = parentActivationMultiplier * this.attributeMultiplier * this.activationValue;

        if (this.finalAttributeMultiplier > 0)
        {
            this.playTime += deltaTime;
        }
    }

    /**
     * Final activation strength for one placement, multiplied by the optional
     * lifetime curve sampled per the lifetime formula
     * (EveSmartLightBaseAttributeModifier.cpp:127-151).
     */
    GetActivationStrength(placement)
    {
        let activationMultiplier = 1;

        if (this.activationOverLifetime)
        {
            const idOffset = Number(placement?.initialPlacementID ?? 0) * this.perInstanceOffset;
            switch (this.lifeTimeFormula)
            {
                case EveSmartLightBaseAttributeModifier.LifeTimeFormulas.PER_INSTANCE_LIFETIME:
                    activationMultiplier = this.activationOverLifetime.GetValueAt((placement?.lifeTime ?? 0) + idOffset);
                    break;
                case EveSmartLightBaseAttributeModifier.LifeTimeFormulas.PER_MODIFIER_PLAYTIME:
                    activationMultiplier = this.activationOverLifetime.GetValueAt(this.playTime + idOffset);
                    break;
                case EveSmartLightBaseAttributeModifier.LifeTimeFormulas.STATIC:
                    activationMultiplier = this.activationOverLifetime.GetValueAt(idOffset);
                    break;
                default:
                    break;
            }
        }

        return this.finalAttributeMultiplier * activationMultiplier;
    }

    /** Carbon declares ResetChildren inline empty on the base (EveSmartLightBaseAttributeModifier.h:41). */
    ResetChildren(_parentActive)
    {
    }

    static LifeTimeFormulas = LifeTimeFormulas;

}
