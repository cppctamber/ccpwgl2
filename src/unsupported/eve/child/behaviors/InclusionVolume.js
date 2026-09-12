// Source: trinity/trinity/Eve/SpaceObject/Children/Behaviors/InclusionVolume.h
//   trinity/trinity/Eve/SpaceObject/Children/Behaviors/InclusionVolume.cpp
import { meta } from "utils";
import { IBehavior } from "./IBehavior";
import { vec3 } from "math";
import { ProcessPriority } from "./enums";

// Module scratch for the per-agent loop (behavior updates run sequentially).
const FORCE = vec3.create();
const NORMALIZED_FORCE = vec3.create();
const FORCE_OFFSET = vec3.create();
const NO_FORCES = [];

/**
  * Drone behavior that pulls agents back toward the inclusion volumes once they
  * drift into the falloff shell; agents fully inside feel no force.
  */

@meta.define("InclusionVolume", true)
export class InclusionVolume extends IBehavior
{

    static ProcessPriority = ProcessPriority;

    /** m_priority (int32_t) [READWRITE, PERSIST, NOTIFY, ENUM] */
    @meta.int32
    behaviorPriority = 0;

    /** m_inclusionVolumes (PIEveVolumeVector) [READ, PERSIST] */
    @meta.list("IEveVolume")
    inclusionVolumes = [];

    /** m_behaviorWeight (float) [READWRITE, PERSIST] */
    @meta.float
    behaviorWeight = 60;

    /** m_enabled (bool) [READWRITE, PERSIST] */
    @meta.boolean
    enabled = true;

    /** m_framesBetweenUpdates (int32_t) [READWRITE, PERSIST] */
    @meta.int32
    framesBetweenUpdates = 11;

    // Per-frame cache of the inclusion volume centres, prefetched so the
    // per-agent loop stays allocation-free.
    _volumeCenters = [];

    _returnForces = [];

    /** Carbon InclusionVolume::GetProcessPriority (cpp:21-24). */
    GetProcessPriority()
    {
        return this.behaviorPriority;
    }

    /**
      * Pulls each agent back toward the inclusion volumes when it drifts into
      * their falloff shell; fully-inside agents feel no force (Carbon
      * CalculateBehavior, cpp:26-69).
      * @param {Array} agents - DroneAgent records
      * @param {Array|null} _scratchData - unused (no scratch)
      * @param {Number} _deltaTime
      * @param {Object} group - owning BehaviorGroup
      * @param {Object} _system - owning EveChildBehaviorSystem
      * @param {Array} _dronesInSearchRadius - unused
      * @returns {Array} debug force pairs when group.collectForces is on
      */
    // Browser adaptation: Carbon pushes a debug force pair for every agent unconditionally; the JS port collects them only when group.collectForces is set to keep the per-agent loop allocation-free.
    CalculateBehavior(agents, _scratchData, _deltaTime, group, _system, _dronesInSearchRadius)
    {
        if (!this.enabled)
        {
            return NO_FORCES;
        }

        const returnForces = this._returnForces;
        returnForces.length = 0;

        const centers = this._volumeCenters;
        centers.length = 0;
        for (const volume of this.inclusionVolumes)
        {
            centers.push(volume.GetBoundingSphere().center);
        }

        for (const agent of agents)
        {
            vec3.set(FORCE, 0, 0, 0);
            vec3.set(NORMALIZED_FORCE, 0, 0, 0);

            for (let i = 0; i < this.inclusionVolumes.length; i++)
            {
                const status = Number(this.inclusionVolumes[i].GetIntensity(agent.position));

                if (status === 1)
                {
                    vec3.set(FORCE, 0, 0, 0);
                    vec3.set(NORMALIZED_FORCE, 0, 0, 0);
                    break;
                }
                else if (status > 0 && centers[i])
                {
                    vec3.subtract(NORMALIZED_FORCE, centers[i], agent.position);
                    vec3.normalize(NORMALIZED_FORCE, NORMALIZED_FORCE);
                    vec3.scale(FORCE, NORMALIZED_FORCE, this.behaviorWeight);
                }
            }

            vec3.add(agent.acceleration, agent.acceleration, FORCE);

            if (group.collectForces)
            {
                vec3.scale(FORCE_OFFSET, NORMALIZED_FORCE, group.GetBoundingSphereRadius());
                returnForces.push(vec3.add(vec3.create(), agent.position, FORCE_OFFSET));
                returnForces.push(vec3.clone(FORCE));
            }
        }
        return returnForces;
    }

    /** Adds Carbon's inclusion-volume debug option. */
    // Browser adaptation: Tr2DebugRendererOptions is represented by an injected Set-like option bag.
    GetDebugOptions(options = new Set())
    {
        if (options?.add)
        {
            options.add("InclusionVolumes");
        }
        else
        {
            options?.insert?.("InclusionVolumes");
        }
        return options;
    }

    /** Delegates inclusion-volume debug geometry when its option is enabled. */
    // Browser adaptation: ITr2DebugRenderer2 is an injected engine-owned capability.
    RenderDebugInfo(renderer, _agents, parentWorldLocation)
    {
        if (!renderer?.HasOption?.(this, "InclusionVolumes"))
        {
            return;
        }
        for (const volume of this.inclusionVolumes)
        {
            volume.RenderDebugInfo(renderer, parentWorldLocation);
        }
    }

}
