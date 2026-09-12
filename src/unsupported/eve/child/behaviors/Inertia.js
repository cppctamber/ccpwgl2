// Source: trinity/trinity/Eve/SpaceObject/Children/Behaviors/Inertia.h
//   trinity/trinity/Eve/SpaceObject/Children/Behaviors/Inertia.cpp
// Hand-maintained from Carbon source, promoted out of generated intake.
import { meta } from "utils";
import { IBehavior } from "./IBehavior";
import { quat } from "math";
import { vec3 } from "math";

// Module scratch for the per-agent loop (behavior updates run sequentially).
const LAST_ACCEL_NORMALIZED = vec3.create();
const ACCEL_NORMALIZED = vec3.create();
const ROTATION_AXIS = vec3.create();
const ROTATION_QUAT = quat.create();
const NO_FORCES = [];

// Carbon ClampLength: in-place clamp of a vec3 to a maximum length.
function ClampLength(value, maxLength)
{
    const lengthSq = vec3.squaredLength(value);
    if (lengthSq > maxLength * maxLength && lengthSq > 0)
    {
        vec3.scale(value, value, maxLength / Math.sqrt(lengthSq));
    }
    return value;
}

/** A steering behaviour that smooths each agent's acceleration by rotating it toward the previous frame's direction at a limited angular speed and blending its magnitude toward the desired value. */

@meta.define("Inertia", true)
export class Inertia extends IBehavior
{

    /** m_priority (int32_t) [READWRITE, PERSIST, NOTIFY, ENUM] */
    @meta.int32
    behaviorPriority = 0;

    /** m_minInertiaWeight (float) [READWRITE, PERSIST] */
    @meta.float
    minInertiaWeight = 0.1;

    /** m_maxRotationSpeed (float) [READWRITE, PERSIST] */
    @meta.float
    maxRotationSpeed = 3.14;

    /** m_maxAcceleration (float) [READWRITE, PERSIST] */
    @meta.float
    maxAcceleration = 60;

    /** m_enabled (bool) [READWRITE, PERSIST] */
    @meta.boolean
    enabled = true;

    _returnForces = [];

    /** Carbon Inertia::GetProcessPriority (cpp:20-23). */
    GetProcessPriority()
    {
        return this.behaviorPriority;
    }

    /** Per-agent scratch record count (Carbon sizeof(InertiaData)). */
    // Browser adaptation: Carbon returns a byte size; the JS port models scratch as one plain record per agent, so any non-zero value means 'has scratch'.
    GetScratchMemorySize()
    {
        return 1;
    }

    /** Fresh per-agent scratch record (Carbon InertiaData placement init). */
    // Browser adaptation: Carbon initializes caller-provided raw memory; the JS port returns the fresh record instead.
    InitializeScratch()
    {
        return {
            agentAccel: vec3.create(),
            inertiaWeight: 0
        };
    }

    /**
      * Turns the accumulated acceleration toward last frame's direction at a
      * limited angular speed and blends its magnitude by the agent's remaining
      * headroom (Carbon CalculateBehavior, cpp:35-82).
      * @param {Array} agents - DroneAgent records
      * @param {Array} scratchData - per-agent InertiaData records
      * @param {Number} deltaTime
      * @param {Object} group - owning BehaviorGroup
      * @param {Object} _system - owning EveChildBehaviorSystem
      * @param {Array} _dronesInSearchRadius - unused
      * @returns {Array} debug forces when group.collectForces is on
      */
    // Browser adaptation: Carbon pushes the adjusted acceleration into the debug vector unconditionally; the JS port collects it only when group.collectForces is set to keep the per-agent loop allocation-free.
    CalculateBehavior(agents, scratchData, deltaTime, group, _system, _dronesInSearchRadius)
    {
        if (!this.enabled)
        {
            return NO_FORCES;
        }

        const returnForces = this._returnForces;
        returnForces.length = 0;

        for (let c = 0; c < agents.length; c++)
        {
            const agent = agents[c];
            const data = scratchData?.[c];
            if (!data)
            {
                continue;
            }

            vec3.normalize(LAST_ACCEL_NORMALIZED, data.agentAccel);
            const lastAccelLength = vec3.length(data.agentAccel);
            vec3.normalize(ACCEL_NORMALIZED, agent.acceleration);
            const accelLength = vec3.length(agent.acceleration);

            if (vec3.squaredLength(LAST_ACCEL_NORMALIZED) !== 0 && this.maxRotationSpeed > 0)
            {
                vec3.cross(ROTATION_AXIS, LAST_ACCEL_NORMALIZED, ACCEL_NORMALIZED);
                vec3.normalize(ROTATION_AXIS, ROTATION_AXIS);
                if (vec3.length(ROTATION_AXIS) === 0)
                {
                    vec3.set(ROTATION_AXIS, 0, 1, 0);
                }
                let angle = vec3.angle(LAST_ACCEL_NORMALIZED, ACCEL_NORMALIZED);
                const step = this.maxRotationSpeed * deltaTime;
                angle = Math.min(angle, step);
                if (angle > 0)
                {
                    quat.setAxisAngle(ROTATION_QUAT, ROTATION_AXIS, angle);
                    // Carbon rotates last frame's unit acceleration into the agent's
                    // acceleration (TriVectorRotateQuaternion, cpp:65-67).
                    vec3.transformQuat(agent.acceleration, LAST_ACCEL_NORMALIZED, ROTATION_QUAT);
                }

                const agentVelocityLength = vec3.length(agent.velocity);

                data.inertiaWeight = group.GetMaxVelocity() - agentVelocityLength;
                data.inertiaWeight = Math.min(Math.max(data.inertiaWeight, 0.1), group.GetMaxVelocity());

                const blended = lastAccelLength + (accelLength - lastAccelLength) * (data.inertiaWeight * deltaTime);
                vec3.normalize(agent.acceleration, agent.acceleration);
                vec3.scale(agent.acceleration, agent.acceleration, blended);
                ClampLength(agent.acceleration, this.maxAcceleration);

                if (group.collectForces)
                {
                    returnForces.push(vec3.clone(agent.acceleration));
                }
            }
            vec3.copy(data.agentAccel, agent.acceleration);
        }
        return returnForces;
    }

}
