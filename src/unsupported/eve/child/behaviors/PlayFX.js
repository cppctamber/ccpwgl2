// Source: trinity/trinity/Eve/SpaceObject/Children/Behaviors/PlayFX.h
//   trinity/trinity/Eve/SpaceObject/Children/Behaviors/PlayFX.cpp
// Hand-maintained from Carbon source, promoted out of generated intake.
import { meta } from "utils";
import { IBehavior } from "./IBehavior";
import { vec3 } from "math";

// Module scratch for the per-agent loop (behavior updates run sequentially).
const OFFSET_EFFECT = vec3.create();
const OFFSET_EFFECT_WS = vec3.create();
const AGENT_TARGET_WS = vec3.create();
const NO_FORCES = [];

/** A steering-group behaviour that clones, aims, and starts or stops a firing effect on each drone as it arrives at and departs from its target. */

@meta.define("PlayFX", true)
export class PlayFX extends IBehavior
{

    /** m_priority (int32_t) [READWRITE, PERSIST, NOTIFY, ENUM] */
    @meta.int32
    behaviorPriority = 0;

    /** m_behaviorWeight (float) [READWRITE, PERSIST] */
    @meta.float
    behaviorWeight = 20;

    /** m_firingEffect (IEveFiringEffectElementPtr) [READWRITE, PERSIST] */
    @meta.struct("EveStretch2", "EveStretch3")
    firingEffect = null;

    /** m_firingEffects (PIEveFiringEffectElementVector) [READ] */
    @meta.isPrivate
    @meta.list("EveStretch2", "EveStretch3")
    generatedFiringEffects = [];

    /** m_sec (int32_t) [READWRITE, PERSIST] */
    @meta.int32
    sec = 1;

    /** m_enabled (bool) [READWRITE, PERSIST] */
    @meta.boolean
    enabled = true;

    // Carbon m_count/m_stop runtime state.
    _count = 0;

    _stop = false;

    /** Carbon PlayFX::GetProcessPriority (cpp:25-28). */
    GetProcessPriority()
    {
        return this.behaviorPriority;
    }

    /** Carbon PlayFX::GetBehaviorName (cpp:30-33). */
    GetBehaviorName()
    {
        return "PlayFX";
    }

    /** Per-agent scratch record count (Carbon sizeof(PlayFXData)). */
    // Browser adaptation: Carbon returns a byte size; the JS port models scratch as one plain record per agent, so any non-zero value means 'has scratch'.
    GetScratchMemorySize()
    {
        return 1;
    }

    /** Fresh per-agent scratch record (Carbon PlayFXData placement init). */
    // Browser adaptation: Carbon initializes caller-provided raw memory; the JS port returns the fresh record instead.
    InitializeScratch()
    {
        return {
            effectPlaying: false,
            droneArrived: false,
            oldTarget: vec3.create()
        };
    }

    /** Carbon IBehavior::UpdateState override (h:55-58). */
    UpdateState(state)
    {
        this._stop = !!state;
    }

    /**
      * Drives one cloned firing effect per agent: starts firing when the agent
      * arrives (agent.playFX), aims it in world space, and stops it after m_sec
      * seconds (Carbon CalculateBehavior, cpp:45-139).
      * @param {Array} agents - DroneAgent records
      * @param {Array} scratchData - per-agent PlayFXData records
      * @param {Number} _deltaTime
      * @param {Object} group - owning BehaviorGroup
      * @param {Object} system - owning EveChildBehaviorSystem
      * @param {Array} _dronesInSearchRadius - unused
      * @returns {Array} empty (as Carbon)
      */
    // Browser adaptation: Carbon's Be::Time 100ns clock maps to Date.now seconds against agent.fxStartTime.
    CalculateBehavior(agents, scratchData, _deltaTime, group, system, _dronesInSearchRadius)
    {
        if (this.behaviorWeight <= 0 || !this.enabled)
        {
            for (const fx of this.generatedFiringEffects)
            {
                if (!fx) continue;
                fx.StopFiring();
            }
            return NO_FORCES;
        }

        if (this.firingEffect === null)
        {
            return NO_FORCES;
        }

        // If the drone count is 0 the count is not updated so this is needed
        if (this.generatedFiringEffects.length === 0)
        {
            this._count = 0;
        }

        if (this._count !== agents.length)
        {
            this._CheckCount(agents.length);
        }

        const worldTransform = system.GetWorldTransform();
        const limit = Math.min(agents.length, this.generatedFiringEffects.length);

        // This behavior activates when the drone has arrived near its locator
        for (let c = 0; c < limit; c++)
        {
            const agent = agents[c];
            const firingEffect = this.generatedFiringEffects[c];
            const data = scratchData?.[c];
            if (!data || !firingEffect)
            {
                continue;
            }

            if (this._stop)
            {
                data.droneArrived = false;
            }

            // Make sure the effect isn't showing when loading everything up
            if (data.droneArrived === false)
            {
                firingEffect.SetDisplay(false);
            }

            // Drone has arrived at its target so play the effect
            if (agent.playFX && !data.effectPlaying)
            {
                if (data.droneArrived === false)
                {
                    data.droneArrived = true;
                    firingEffect.SetDisplay(true);
                }

                firingEffect.StartFiring(0);
                data.effectPlaying = true;
            }

            vec3.normalize(OFFSET_EFFECT, agent.targetDirection);
            vec3.scale(OFFSET_EFFECT, OFFSET_EFFECT, group.GetBoundingSphereRadius());
            vec3.add(OFFSET_EFFECT, OFFSET_EFFECT, agent.position);

            // Set the effect's pos to world space
            vec3.transformMat4(OFFSET_EFFECT_WS, OFFSET_EFFECT, worldTransform);

            // Without this the drone would start shooting at the new target because
            // of the cooldown of the effect
            if (vec3.squaredLength(data.oldTarget) !== 0)
            {
                firingEffect.SetFiringTransform(OFFSET_EFFECT_WS, data.oldTarget);
            }

            if (data.effectPlaying)
            {
                vec3.transformMat4(AGENT_TARGET_WS, agent.target, worldTransform);
                firingEffect.SetFiringTransform(OFFSET_EFFECT_WS, AGENT_TARGET_WS);

                const elapsed = Date.now() / 1000 - agent.fxStartTime;
                if (elapsed > this.sec)
                {
                    firingEffect.StopFiring();
                    data.effectPlaying = false;
                    agent.playFX = false;
                    vec3.copy(data.oldTarget, AGENT_TARGET_WS);
                    vec3.set(agent.target, 0, 0, 0);
                }
            }
        }

        return NO_FORCES;
    }

    // Browser adaptation: ccpwgl firing effects use one dt update and view preparation.
    UpdateAsyncronous(context, parentTransform)
    {
        for (const fx of this.generatedFiringEffects)
        {
            fx.Update(context.dt);
            fx.UpdateViewDependentData(parentTransform);
        }
    }

    UpdateSyncronous() {}

    GetBatches(mode, accumulator, perObjectData)
    {
        let added = false;
        for (const fx of this.generatedFiringEffects) added = fx.GetBatches(mode, accumulator, perObjectData) || added;
        return added;
    }

    GetResources(out = [])
    {
        if (this.firingEffect) this.firingEffect.GetResources(out);
        for (const fx of this.generatedFiringEffects) fx.GetResources(out);
        return out;
    }

    GetLights(collector)
    {
        for (const fx of this.generatedFiringEffects) if (fx.GetLights) fx.GetLights(collector);
    }

    RegisterComponents() {}
    UnRegisterComponents() {}

    /** Carbon method RegisterWithQuadRenderer (cpp:239-245) - quad renderer
      * registration seam; the firing effect elements own the real quads. */
    RegisterWithQuadRenderer(_quadRenderer)
    {
    }

    /** Carbon method AddQuadsToQuadRenderer (cpp:253-259) - quad renderer
      * submission seam; the firing effect elements own the real quads. */
    AddQuadsToQuadRenderer(_frustum, _quadRenderer)
    {
    }

    // Grows or shrinks the cloned firing-effect list to the agent count (Carbon
    // CheckCount, cpp:262-299; BeClasses->CloneTo maps to CjsModel.Clone).
    /**
      * Grows or shrinks the cloned firing-effect list to match the agent count, cloning the configured effect for new agents and dropping the excess.
      */
    _CheckCount(agentSize)
    {
        if (this._count > agentSize)
        {
            const diff = this._count - agentSize;
            for (let i = 0; i < diff; i++)
            {
                const effect = this.generatedFiringEffects.pop();
                effect.StopFiring();
                effect.Destroy();
            }
            this._count = agentSize;
        }
        else if (agentSize > this._count)
        {
            if (this.firingEffect === null)
            {
                return;
            }

            const diff = agentSize - this._count;
            for (let i = 0; i < diff; i++)
            {
                // Carbon CloneTo follows persisted strong references, including
                // controller targets. The generated list is runtime-only above.
                const newFx = this.firingEffect.Clone();
                if (!newFx)
                {
                    return;
                }
                this.generatedFiringEffects.push(newFx);
            }
            this._count = agentSize;
        }
    }

}
