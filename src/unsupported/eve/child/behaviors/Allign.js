// Source: trinity/trinity/Eve/SpaceObject/Children/Behaviors/Allign.h
//   trinity/trinity/Eve/SpaceObject/Children/Behaviors/Allign.cpp
// Hand-maintained from Carbon source, promoted out of generated intake.
import { meta } from "utils";
import { IBehavior } from "./IBehavior";
import { vec3 } from "math";

// Module scratch for the per-agent loop (behavior updates run sequentially).
const GROUP_DIRECTION = vec3.create();
const FORCE_OFFSET = vec3.create();
const NO_FORCES = [];

/** A steering behaviour that pulls each drone's acceleration toward the average acceleration direction of its nearby neighbours, recomputing the pull force on a throttled schedule and reusing it between refreshes. */

@meta.define("Allign", true)
export class Allign extends IBehavior
{

    /** m_priority (int32_t) [READWRITE, PERSIST, NOTIFY, ENUM] */
    @meta.int32
    behaviorPriority = 0;

    /** m_behaviorWeight (float) [READWRITE, PERSIST] */
    @meta.float
    behaviorWeight = 1;

    /** m_visionRange (float) [READWRITE, PERSIST] */
    @meta.float
    visionRange = 75;

    /** m_enabled (bool) [READWRITE, PERSIST] */
    @meta.boolean
    enabled = true;

    /** m_framesBetweenUpdates (int32_t) [READWRITE, PERSIST] */
    @meta.int32
    framesBetweenUpdates = 61;

    // Carbon m_frameCounter/m_lastPullForces runtime state.
    _frameCounter = 0;

    _lastPullForces = [];

    _returnForces = [];

    /** Carbon Allign::GetProcessPriority (cpp:22-25). */
    GetProcessPriority()
    {
        return this.behaviorPriority;
    }

    /**
      * Pulls each agent toward its neighbourhood's average acceleration
      * direction on refresh frames and replays the cached pull forces in
      * between (Carbon CalculateBehavior, cpp:27-102).
      * @param {Array} agents - DroneAgent records
      * @param {Array|null} _scratchData - unused (no scratch)
      * @param {Number} _deltaTime
      * @param {Object} group - owning BehaviorGroup
      * @param {Object} _system - owning EveChildBehaviorSystem
      * @param {Array} dronesInSearchRadius - per-agent neighbour lists
      * @returns {Array} debug force pairs when group.collectForces is on
      */
    // Browser adaptation: Debug force pairs are only collected when group.collectForces is set, keeping the per-agent loop allocation-free.
    CalculateBehavior(agents, _scratchData, _deltaTime, group, _system, dronesInSearchRadius)
    {
        if (!this.enabled)
        {
            return NO_FORCES;
        }

        const returnForces = this._returnForces;
        returnForces.length = 0;

        if (this._frameCounter === 0)
        {
            let c = 0;
            for (const agent of agents)
            {
                const neighbours = dronesInSearchRadius[c] ?? NO_FORCES;
                const pullForce = this._PullForceAt(c);
                c++;
                if (neighbours.length === 0)
                {
                    vec3.set(pullForce, 0, 0, 0);
                    continue;
                }

                vec3.set(GROUP_DIRECTION, 0, 0, 0);
                for (const other of neighbours)
                {
                    if (other.id === agent.id)
                    {
                        continue;
                    }
                    vec3.add(GROUP_DIRECTION, GROUP_DIRECTION, other.acceleration);
                }

                vec3.normalize(pullForce, GROUP_DIRECTION);
                vec3.scale(pullForce, pullForce, this.behaviorWeight);

                if (vec3.squaredLength(pullForce) > 0)
                {
                    vec3.add(agent.acceleration, agent.acceleration, pullForce);
                }
                else
                {
                    vec3.set(pullForce, 0, 0, 0);
                }

                if (group.collectForces)
                {
                    vec3.normalize(FORCE_OFFSET, pullForce);
                    vec3.scale(FORCE_OFFSET, FORCE_OFFSET, group.GetBoundingSphereRadius());
                    returnForces.push(vec3.add(vec3.create(), agent.position, FORCE_OFFSET));
                    returnForces.push(vec3.clone(pullForce));
                }
            }
            this._lastPullForces.length = c;
        }
        else
        {
            if (this._lastPullForces.length === 0)
            {
                return returnForces;
            }

            let c = 0;
            for (const agent of agents)
            {
                if (c >= this._lastPullForces.length)
                {
                    break;
                }

                const pullForce = this._lastPullForces[c];
                vec3.add(agent.acceleration, agent.acceleration, pullForce);

                if (group.collectForces && vec3.squaredLength(pullForce) > 0)
                {
                    vec3.normalize(FORCE_OFFSET, pullForce);
                    vec3.scale(FORCE_OFFSET, FORCE_OFFSET, group.GetBoundingSphereRadius());
                    returnForces.push(vec3.add(vec3.create(), agent.position, FORCE_OFFSET));
                    returnForces.push(vec3.clone(pullForce));
                }
                c++;
            }
        }
        return returnForces;
    }

    /** Carbon Allign::GetBehaviorSearchRadius (cpp:104-116). */
    GetBehaviorSearchRadius()
    {
        if (this._frameCounter >= this.framesBetweenUpdates)
        {
            this._frameCounter = 0;
            return this.visionRange;
        }
        this._frameCounter++;
        return -1;
    }

    // Reuses (or grows) the cached pull-force slot for one agent index.
    /**
      * The cached pull-force vector for an agent index, created on first use.
      */
    _PullForceAt(index)
    {
        let force = this._lastPullForces[index];
        if (!force)
        {
            force = vec3.create();
            this._lastPullForces[index] = force;
        }
        return force;
    }

}
