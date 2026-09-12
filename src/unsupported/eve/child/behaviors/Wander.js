// Source: trinity/trinity/Eve/SpaceObject/Children/Behaviors/Wander.h
//   trinity/trinity/Eve/SpaceObject/Children/Behaviors/Wander.cpp
import { meta } from "utils";
import { IBehavior } from "./IBehavior";
import { vec3 } from "math";
import { noise } from "math";
const carbonPerlin1D = noise.carbonPerlin1D;
import { ProcessPriority } from "./enums";

// Module scratch for the per-agent loop (behavior updates run sequentially).
const FORCE = vec3.create();
const FORCE_OFFSET = vec3.create();
const NO_FORCES = [];

/**
  * Drone behavior that adds a per-agent Perlin-noise wander force seeded from the
  * agent's lifetime and id, so each drone drifts on its own path.
  */

@meta.define("Wander", true)
export class Wander extends IBehavior
{

    static ProcessPriority = ProcessPriority;

    /** m_priority (int32_t) [READWRITE, PERSIST, NOTIFY, ENUM] */
    @meta.int32
    behaviorPriority = 0;

    /** rand1 (float) [READWRITE, PERSIST] */
    @meta.float
    rand1 = 0.2;

    /** rand2 (float) [READWRITE, PERSIST] */
    @meta.float
    rand2 = 0.8;

    /** rand3 (float) [READWRITE, PERSIST] */
    @meta.float
    rand3 = 1.2;

    /** m_freq (float) [READWRITE, PERSIST] */
    @meta.float
    freq = 2;

    /** m_weightWander (float) [READWRITE, PERSIST] */
    @meta.float
    weightWander = 240;

    /** m_enabled (bool) [READWRITE, PERSIST] */
    @meta.boolean
    enabled = true;

    _returnForces = [];

    /** Carbon Wander::GetProcessPriority (cpp:23-26). */
    GetProcessPriority()
    {
        return this.behaviorPriority;
    }

    /**
      * Adds a per-agent Perlin wander force seeded from lifetime + id (Carbon
      * CalculateBehavior, cpp:28-52; PerlinNoise1D maps to carbonPerlin1D).
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

        for (const agent of agents)
        {
            const seed = agent.lifetime + agent.id;

            vec3.set(
                FORCE,
                carbonPerlin1D(seed * this.rand1 * this.freq, 2, 1, 1),
                carbonPerlin1D(seed * this.rand2 * this.freq, 2, 1, 1),
                carbonPerlin1D(seed * this.rand3 * this.freq, 2, 1, 1)
            );

            if (group.collectForces)
            {
                vec3.normalize(FORCE_OFFSET, FORCE);
                vec3.scale(FORCE_OFFSET, FORCE_OFFSET, group.GetBoundingSphereRadius());
                returnForces.push(vec3.add(vec3.create(), agent.position, FORCE_OFFSET));
            }

            vec3.scale(FORCE, FORCE, this.weightWander);

            if (group.collectForces)
            {
                returnForces.push(vec3.clone(FORCE));
            }

            vec3.add(agent.acceleration, agent.acceleration, FORCE);
        }
        return returnForces;
    }

}
