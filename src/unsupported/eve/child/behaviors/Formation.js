// Source: trinity/trinity/Eve/SpaceObject/Children/Behaviors/Formation.h
//   trinity/trinity/Eve/SpaceObject/Children/Behaviors/Formation.cpp
// Hand-maintained from Carbon source, promoted out of generated intake.
import { meta } from "utils";
import { IBehavior } from "./IBehavior";
import { quat } from "math";
import { vec3 } from "math";

// Module scratch for the per-agent loops (behavior updates run sequentially).
const ACCEL_NORMALIZED = vec3.create();
const GROUP_ALIGNMENT = vec3.create();
const SLOT_VECTOR = vec3.create();
const TARGET_DIR = vec3.create();
const UP_AXIS = vec3.fromValues(0, 1, 0);
const ROTATION_AXIS = vec3.create();
const ROTATION_QUAT = quat.create();
const FORMATION_ACCELERATION = vec3.create();
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

/** A steering behaviour that detects when a drone group's motion has converged, organises the agents into a rotating slot grid, and pulls each agent toward its assigned slot. */

@meta.define("Formation", true)
export class Formation extends IBehavior
{

    /** m_priority (int32_t) [READWRITE, PERSIST, NOTIFY, ENUM] */
    @meta.int32
    behaviorPriority = 0;

    /** m_behaviorWeight (float) [READWRITE, PERSIST] */
    @meta.float
    behaviorWeight = 300;

    /** m_inFormation (bool) [READ] */
    @meta.boolean
    inFormation = false;

    /** m_maxFormationVelocityScaler (float) [READWRITE, PERSIST] */
    @meta.float
    maxFormationVelocityScaler = 0.85;

    /** m_stubbornness (int32_t) [READWRITE, PERSIST] */
    @meta.int32
    stubbornness = 3;

    /** m_enabled (bool) [READWRITE, PERSIST] */
    @meta.boolean
    enabled = true;

    /** m_framesBetweenUpdates (int32_t) [READWRITE, PERSIST] */
    @meta.int32
    framesBetweenUpdates = 15;

    // Carbon runtime state: the slot grid (vec3 offsets from the formation
    // centre), its reservation flags, and the frame/consistency counters.
    _formationGrid = [];

    _formationGridReserver = [];

    _formationPosition = vec3.create();

    _formationSpeed = vec3.create();

    _formationAcceleration = vec3.create();

    _lastFormationAcceleration = vec3.create();

    _isFormalizing = false;

    _frameCounter = 0;

    _stubbornnessCounter = 0;

    /** Carbon Formation::GetProcessPriority (cpp:43-46). */
    GetProcessPriority()
    {
        return this.behaviorPriority;
    }

    /** Carbon Formation::GetBehaviorName (cpp:48-51). */
    GetBehaviorName()
    {
        return "Formation";
    }

    /** Per-agent scratch record count (Carbon sizeof(FormationData)). */
    // Browser adaptation: Carbon returns a byte size; the JS port models scratch as one plain record per agent, so any non-zero value means 'has scratch'.
    GetScratchMemorySize()
    {
        return 1;
    }

    /** Fresh per-agent scratch record (Carbon FormationData placement init). */
    // Browser adaptation: Carbon initializes caller-provided raw memory; the JS port returns the fresh record instead.
    InitializeScratch()
    {
        return {
            assignedSlot: -1
        };
    }

    /** Carbon Formation::InFormation (cpp:53-56). */
    InFormation()
    {
        return this.inFormation;
    }

    /** Carbon Formation::Reset (cpp:261-264). */
    Reset()
    {
        this._BreakFormation();
    }

    /**
      * Consistency-gated formation state machine: checks whether the agents keep
      * agreeing on a direction, forms/breaks the grid accordingly, and drives
      * agents to their assigned slots while formed (Carbon CalculateBehavior,
      * cpp:58-125).
      * @param {Array} agents - DroneAgent records
      * @param {Array} scratchData - per-agent FormationData records
      * @param {Number} deltaTime
      * @param {Object} group - owning BehaviorGroup
      * @param {Object} _system - owning EveChildBehaviorSystem
      * @param {Array} _dronesInSearchRadius - unused
      * @returns {Array} empty (as Carbon)
      */
    CalculateBehavior(agents, scratchData, deltaTime, group, _system, _dronesInSearchRadius)
    {
        if (!this.enabled)
        {
            return NO_FORCES;
        }

        if (this._frameCounter >= this.framesBetweenUpdates)
        {
            // we'll do a check
            if (this._CheckIfFormalizing(agents, scratchData))
            {
                // we only enable formation if the check passes a few times in a row
                if (!this.inFormation && this._stubbornnessCounter >= this.stubbornness)
                {
                    this._InitializeFormation(agents, scratchData, group.GetBoundingSphereRadius());
                }
                else
                {
                    if (this._isFormalizing === true)
                    {
                        this._stubbornnessCounter++;
                    }
                    else
                    {
                        this._stubbornnessCounter = 0;
                    }

                    this._isFormalizing = true;
                }
            }
            else
            {
                if (this.inFormation && this._stubbornnessCounter >= this.stubbornness)
                {
                    this._BreakFormation();
                }
                else
                {
                    if (this._isFormalizing === true)
                    {
                        this._stubbornnessCounter++;
                    }
                    else
                    {
                        this._stubbornnessCounter = 0;
                    }

                    this._isFormalizing = false;
                }
            }
        }
        else
        {
            this._frameCounter++;
        }

        if (this.inFormation)
        {
            this._UpdateFormation(deltaTime, group);
            this._UpdateAgents(agents, scratchData, group.GetBoundingSphereRadius());
        }

        return NO_FORCES;
    }

    // Tests whether the agents are being dragged the same way, only accounting
    // for behaviors that ran before this one (Carbon CheckIfFormalizing,
    // cpp:127-170).
    /**
      * Whether the agents' accelerations, or once formed their pull toward their assigned slots, agree on a common direction.
      */
    _CheckIfFormalizing(agents, scratchData)
    {
        if (agents.length === 0)
        {
            return false;
        }

        let disagreeingDrones = 0;
        vec3.normalize(GROUP_ALIGNMENT, agents[0].acceleration);
        vec3.set(this._formationAcceleration, 0, 0, 0);

        for (let c = 0; c < agents.length; c++)
        {
            const agent = agents[c];
            const data = scratchData?.[c];
            vec3.normalize(ACCEL_NORMALIZED, agent.acceleration);

            if (!(vec3.dot(ACCEL_NORMALIZED, GROUP_ALIGNMENT) > 0))
            {
                if (this.inFormation)
                {
                    const slot = this._formationGrid[data?.assignedSlot ?? -1];
                    if (slot)
                    {
                        vec3.add(SLOT_VECTOR, this._formationPosition, slot);
                        vec3.subtract(SLOT_VECTOR, SLOT_VECTOR, agent.position);
                        vec3.normalize(SLOT_VECTOR, SLOT_VECTOR);
                        if (vec3.dot(ACCEL_NORMALIZED, SLOT_VECTOR) < 0)
                        {
                            disagreeingDrones++;
                        }
                    }
                }
                else
                {
                    disagreeingDrones++;
                    vec3.lerp(GROUP_ALIGNMENT, GROUP_ALIGNMENT, ACCEL_NORMALIZED, 0.5);
                }
            }

            vec3.add(this._formationAcceleration, this._formationAcceleration, ACCEL_NORMALIZED);
        }

        if (disagreeingDrones >= 0.1 * agents.length)
        {
            return false;
        }

        return true;
    }

    // Finds the centre point, builds the slot grid, and assigns each agent its
    // nearest free slot (Carbon InitializeFormation, cpp:172-195).
    /**
      * Computes the group's centre from the agent positions, builds the slot grid, assigns each agent a slot, and marks the group in formation.
      */
    _InitializeFormation(agents, scratchData, radius)
    {
        if (agents.length === 0)
        {
            return;
        }

        vec3.set(this._formationPosition, 0, 0, 0);
        vec3.set(TARGET_DIR, 0, 0, 0);

        for (const agent of agents)
        {
            vec3.add(this._formationPosition, this._formationPosition, agent.position);
            vec3.add(TARGET_DIR, TARGET_DIR, agent.acceleration);
        }

        vec3.scale(this._formationPosition, this._formationPosition, 1 / agents.length);

        this._CreateFormationGrid(agents, TARGET_DIR, radius);
        this._AssignSlots(agents, scratchData);

        this.inFormation = true;
    }

    // Builds a square slot grid facing the group's pull direction (Carbon
    // CreateFormationGrid, cpp:197-225). Grid slots are allocated here - a
    // formation-creation event, not the per-frame path.
    /**
      * Builds a square grid of slot offsets around the formation centre, oriented to face the group's average pull direction.
      */
    _CreateFormationGrid(agents, targetDir, radius)
    {
        targetDir[1] = this._formationPosition[1];
        vec3.normalize(targetDir, targetDir);

        const angle = vec3.angle(UP_AXIS, targetDir);
        quat.setAxisAngle(ROTATION_QUAT, UP_AXIS, angle);

        this._formationGrid.length = 0;
        this._formationGridReserver.length = 0;

        let num = agents.length;
        num = Math.floor(Math.sqrt(num - 1)) + 1;

        for (let i = 0; i < num; i++)
        {
            for (let j = 0; j < num; j++)
            {
                const r = 2.5 * radius;
                const slot = vec3.fromValues((-(num / 2) + i) * r, 0, (-(num / 2) + j) * r);
                vec3.transformQuat(slot, slot, ROTATION_QUAT);
                this._formationGrid.push(slot);
                this._formationGridReserver.push(false);
            }
        }
    }

    // Nearest-free-slot assignment (Carbon AssignSlots, cpp:227-258).
    /**
      * Assigns each agent to its nearest unreserved formation slot.
      */
    _AssignSlots(agents, scratchData)
    {
        for (let c = 0; c < agents.length; c++)
        {
            const agent = agents[c];
            const data = scratchData?.[c];
            let nearestSlot = -1;
            let closestLength = 0;
            for (let index = 0; index < this._formationGrid.length; index++)
            {
                if (!this._formationGridReserver[index])
                {
                    vec3.add(SLOT_VECTOR, this._formationPosition, this._formationGrid[index]);
                    vec3.subtract(SLOT_VECTOR, agent.position, SLOT_VECTOR);
                    const lengthToSlot = vec3.squaredLength(SLOT_VECTOR);
                    if (nearestSlot === -1 || lengthToSlot < closestLength)
                    {
                        nearestSlot = index;
                        closestLength = lengthToSlot;
                    }
                }
            }
            if (nearestSlot !== -1)
            {
                this._formationGridReserver[nearestSlot] = true;
                if (data)
                {
                    data.assignedSlot = nearestSlot;
                }
            }
        }
    }

    // Carbon BreakFormation (cpp:266-277).
    /**
      * Resets the formation's position, speed and acceleration state and clears the slot grid, taking the group out of formation.
      */
    _BreakFormation()
    {
        vec3.set(this._formationPosition, 0, 0, 0);
        vec3.set(this._formationSpeed, 0, 0, 0);
        vec3.set(this._lastFormationAcceleration, 0, 0, 0);
        vec3.set(this._formationAcceleration, 0, 0, 0);
        this._isFormalizing = false;
        this.inFormation = false;
        this._formationGrid.length = 0;
        this._formationGridReserver.length = 0;
    }

    // Moves the formation centre like a single ship (Carbon UpdateFormation,
    // cpp:279-294).
    /**
      * Advances the formation centre each frame as if it were a single ship, applying inertia to its acceleration and clamping its speed.
      */
    _UpdateFormation(deltaTime, group)
    {
        vec3.copy(FORMATION_ACCELERATION, this._formationAcceleration);

        this._CalculateFormationInertia(FORMATION_ACCELERATION, deltaTime);

        vec3.add(this._formationSpeed, this._formationSpeed, FORMATION_ACCELERATION);
        ClampLength(this._formationSpeed, group.GetMaxVelocity() * this.maxFormationVelocityScaler);

        vec3.scaleAndAdd(this._formationPosition, this._formationPosition, this._formationSpeed, deltaTime);
    }

    // Limits the formation's angular speed and rotates the whole grid with it
    // (Carbon calculateFormationInertia, cpp:296-325).
    /**
      * Limits the formation's turn rate by rotating its acceleration toward the previous frame's direction, rotating the slot grid with it.
      */
    _CalculateFormationInertia(acceleration, deltaTime)
    {
        vec3.normalize(ACCEL_NORMALIZED, acceleration);

        if (vec3.squaredLength(this._lastFormationAcceleration) !== 0)
        {
            vec3.cross(ROTATION_AXIS, this._lastFormationAcceleration, ACCEL_NORMALIZED);
            vec3.normalize(ROTATION_AXIS, ROTATION_AXIS);
            if (vec3.length(ROTATION_AXIS) === 0)
            {
                vec3.set(ROTATION_AXIS, 0, 1, 0);
            }
            let angle = vec3.angle(this._lastFormationAcceleration, ACCEL_NORMALIZED);
            const step = (0.1 + 2 / Math.max(1, this._formationGrid.length)) * deltaTime;
            angle = Math.min(angle, step);

            if (angle > 0)
            {
                quat.setAxisAngle(ROTATION_QUAT, ROTATION_AXIS, angle);
                // Carbon rotates last frame's (unit) formation acceleration into the
                // working acceleration (TriVectorRotateQuaternion, cpp:314-315).
                vec3.transformQuat(acceleration, this._lastFormationAcceleration, ROTATION_QUAT);

                for (const slot of this._formationGrid)
                {
                    vec3.transformQuat(slot, slot, ROTATION_QUAT);
                }
            }
        }
        vec3.normalize(this._lastFormationAcceleration, acceleration);
    }

    // Damps the other behaviors and pulls each agent toward its slot (Carbon
    // UpdateAgents, cpp:327-347).
    /**
      * Damps each agent's incoming acceleration, pulls it toward its assigned slot, and slows it as it nears that slot.
      */
    _UpdateAgents(agents, scratchData, radius)
    {
        const radiusSq = radius * radius;
        for (let c = 0; c < agents.length; c++)
        {
            const agent = agents[c];
            const data = scratchData?.[c];
            const slot = this._formationGrid[data?.assignedSlot ?? -1];
            if (!slot)
            {
                continue;
            }

            vec3.scale(agent.acceleration, agent.acceleration, 0.5); // reduce the effect of former behaviors

            vec3.add(SLOT_VECTOR, this._formationPosition, slot);
            vec3.subtract(SLOT_VECTOR, SLOT_VECTOR, agent.position);

            const distToSlot = vec3.squaredLength(SLOT_VECTOR);

            if (distToSlot < 2 * radiusSq)
            {
                // drones can slow down based on dist to target
                const damping = 0.5 + 0.5 * Math.min(Math.max(distToSlot / radiusSq - 0.5 * radius, 0), 1);
                vec3.scale(agent.velocity, agent.velocity, damping);
            }

            vec3.normalize(SLOT_VECTOR, SLOT_VECTOR);
            vec3.scaleAndAdd(agent.acceleration, agent.acceleration, SLOT_VECTOR, this.behaviorWeight);
        }
    }

}
