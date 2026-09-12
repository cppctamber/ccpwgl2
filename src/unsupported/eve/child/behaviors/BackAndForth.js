// Source: trinity/trinity/Eve/SpaceObject/Children/Behaviors/BackAndForth.h
//   trinity/trinity/Eve/SpaceObject/Children/Behaviors/BackAndForth.cpp
// Hand-maintained from Carbon source, promoted out of generated intake.
import { meta } from "utils";
import { IBehavior } from "./IBehavior";
import { LocatorType } from "./enums";
import { quat } from "math";
import { vec3 } from "math";
import { EveLocatorSets } from "eve/item/EveLocatorSets";

// Module scratch for the per-agent loop (behavior updates run sequentially).
const Z_AXIS = vec3.fromValues(0, 0, 1);
const UP_AXIS = vec3.fromValues(0, 1, 0);
const TARGET_POINT = vec3.create();
const AGENT_POSITION_WS = vec3.create();
const DESIRED_VELOCITY = vec3.create();
const INV_DIR = vec3.create();
const NO_FORCES = [];

/** A steering behaviour that shuttles each drone between seek and deliver locators, slowing on approach, snapping its facing, and triggering effects on arrival. */

@meta.define("BackAndForth", true)
export class BackAndForth extends IBehavior
{

    /** m_priority (int32_t) [READWRITE, PERSIST, NOTIFY, ENUM] */
    @meta.int32
    behaviorPriority = 0;

    /** m_enabled (bool) [READWRITE, PERSIST, NOTIFY, ENUM] */
    @meta.boolean
    enabled = true;

    /** m_locatorType (LocatorType - enum LocatorType) [READWRITE, PERSIST, ENUM, NOTIFY] */
    @meta.int32
    locatorType = 0;

    /** m_locatorSets (PEveLocatorSetsVector) [READ, PERSIST] */
    @meta.list("EveLocatorSets")
    locatorSet = [];

    /** m_arrivedRadius (float) [READWRITE, PERSIST] */
    @meta.float
    arrivedRadius = 50;

    /** m_distFromOrigin (float) [READWRITE, PERSIST] */
    @meta.float
    distFromOrigin = 20;

    /** m_slowDownRadius (float) [READWRITE, PERSIST] */
    @meta.float
    slowDownRadius = 200;

    /** m_backAndForthWeight (float) [READWRITE, PERSIST] */
    @meta.float
    backAndForthWeight = 100;

    /** m_fxBehavior (IBehavior*) [READWRITE, PERSIST] */
    @meta.struct("IBehavior")
    fxBehavior = null;

    /** m_target (EveSpaceObject2*) [READWRITE, PERSIST] */
    @meta.struct("EveSpaceObject2")
    target = null;

    /** m_parent (EveSpaceObject2*) [READWRITE, PERSIST] */
    @meta.struct("EveSpaceObject2")
    parent = null;

    /** m_seconds (float) [READWRITE] */
    @meta.float
    secondsToTurn = 0.25;

    /** m_locatorSetName (BlueSharedString) [READWRITE, PERSIST] */
    @meta.string
    locatorSetName = "damage";

    // Debug arrival point (Carbon m_arrivalPoint).
    _arrivalPoint = vec3.create();

    /** Carbon BackAndForth::GetProcessPriority (cpp:31-34). */
    GetProcessPriority()
    {
        return this.behaviorPriority;
    }

    /** Carbon BackAndForth::GetBehaviorName (cpp:36-39). */
    GetBehaviorName()
    {
        return "BackAndForth";
    }

    /** Per-agent scratch record count (Carbon sizeof(BackAndForthData)). */
    // Browser adaptation: Carbon returns a byte size; the JS port models scratch as one plain record per agent, so any non-zero value means 'has scratch'.
    GetScratchMemorySize()
    {
        return 1;
    }

    /** Fresh per-agent scratch record (Carbon BackAndForthData placement init). */
    // Browser adaptation: Carbon initializes caller-provided raw memory; the JS port returns the fresh record instead.
    InitializeScratch()
    {
        return {
            locatorTarget: vec3.create(),
            locatorDirection: vec3.create(),
            locatorIndex: -1,
            seek: true,
            deliver: false,
            arrived: true,
            timePassed: 0
        };
    }

    /**
      * Shuttles each agent between its seek/deliver (or parent/target) locators
      * with arrival slow-down, facing snap, and PlayFX triggering (Carbon
      * CalculateBehavior, cpp:51-194).
      * @param {Array} agents - DroneAgent records
      * @param {Array} scratchData - per-agent BackAndForthData records
      * @param {Number} deltaTime
      * @param {Object} group - owning BehaviorGroup
      * @param {Object} system - owning EveChildBehaviorSystem
      * @param {Array} _dronesInSearchRadius - unused
      * @returns {Array} empty (as Carbon)
      */
    // Browser adaptation: TriRandInt maps to Math.random and Be::Time fx timestamps to Date.now seconds; the steering math is ported verbatim.
    CalculateBehavior(agents, scratchData, deltaTime, group, system, _dronesInSearchRadius)
    {
        if (!this.enabled)
        {
            return NO_FORCES;
        }

        if (this.fxBehavior === null)
        {
            this.fxBehavior = group.GetBehaviorByName("PlayFX");
        }

        const worldTransform = system.GetWorldTransform();

        for (let c = 0; c < agents.length; c++)
        {
            const agent = agents[c];
            const data = scratchData?.[c];
            if (!data)
            {
                continue;
            }

            if (this.locatorType === BackAndForth.LocatorType.LOCAL_LOCATORS)
            {
                if (data.arrived)
                {
                    if (data.seek)
                    {
                        const seekLocators = this._GetLocatorsForSet("seek");
                        if (seekLocators !== null && seekLocators.length > 0)
                        {
                            const index = Math.floor(Math.random() * seekLocators.length);
                            vec3.copy(data.locatorTarget, seekLocators[index].position);
                            vec3.transformQuat(data.locatorDirection, UP_AXIS, seekLocators[index].direction);
                        }
                    }
                    else if (data.deliver)
                    {
                        const deliverLocators = this._GetLocatorsForSet("deliver");
                        if (deliverLocators !== null && deliverLocators.length > 0)
                        {
                            const index = Math.floor(Math.random() * deliverLocators.length);
                            vec3.copy(data.locatorTarget, deliverLocators[index].position);
                            vec3.transformQuat(data.locatorDirection, UP_AXIS, deliverLocators[index].direction);
                        }
                    }
                    data.arrived = false;
                }
            }
            else if (this.locatorType === BackAndForth.LocatorType.PARENT_LOCATORS)
            {
                if (this.parent === null)
                {
                    this.parent = group.GetParent();
                }

                if (data.arrived && this.parent)
                {
                    // Pick a new locator to go to
                    const count = Number(this.parent.GetLocatorCount?.(this.locatorSetName) ?? 0);
                    data.locatorIndex = Math.floor(Math.random() * Math.max(count, 1));
                }

                this._GetOwnerLocatorPosition(this.parent, data);
                data.arrived = false;
            }
            else if (this.locatorType === BackAndForth.LocatorType.TARGET_LOCATORS)
            {
                if (data.arrived && this.target)
                {
                    // Pick a new locator to go to
                    const count = Number(this.target.GetLocatorCount?.(this.locatorSetName) ?? 0);
                    data.locatorIndex = Math.floor(Math.random() * Math.max(count, 1));
                }

                this._GetOwnerLocatorPosition(this.target, data);
                data.arrived = false;
            }

            vec3.copy(agent.target, data.locatorTarget);

            // If the direction is (0,0,0) it points up, but then the slow-down
            // radius won't work
            if (vec3.squaredLength(data.locatorDirection) === 0)
            {
                vec3.set(data.locatorDirection, 0, 1, 0);
            }

            vec3.normalize(TARGET_POINT, data.locatorDirection);
            vec3.scale(TARGET_POINT, TARGET_POINT, this.distFromOrigin);
            vec3.add(TARGET_POINT, TARGET_POINT, data.locatorTarget);

            // For debugging
            vec3.copy(this._arrivalPoint, TARGET_POINT);

            vec3.transformMat4(AGENT_POSITION_WS, agent.position, worldTransform);

            vec3.subtract(DESIRED_VELOCITY, TARGET_POINT, AGENT_POSITION_WS);
            const distance = vec3.length(DESIRED_VELOCITY);
            vec3.normalize(DESIRED_VELOCITY, DESIRED_VELOCITY);

            // If we are approaching the target
            if (distance < this.slowDownRadius)
            {
                // make the agent slow down before arriving at target
                vec3.scale(DESIRED_VELOCITY, DESIRED_VELOCITY, this.backAndForthWeight * (distance / this.slowDownRadius));

                // Set the rotation of the drone
                vec3.subtract(INV_DIR, data.locatorTarget, AGENT_POSITION_WS);
                vec3.normalize(INV_DIR, INV_DIR);
                if (vec3.squaredLength(INV_DIR) > 0)
                {
                    quat.rotationTo(agent.rotation, Z_AXIS, INV_DIR);
                }
                data.timePassed = 0;

                // Start playing fx when slowing down
                if (!agent.playFX && this.fxBehavior !== null)
                {
                    agent.fxStartTime = Date.now() / 1000;
                    agent.playFX = true;
                }

                // If the agent has arrived at the target, switch targets
                if (distance < this.arrivedRadius)
                {
                    const seek = data.seek;
                    data.seek = data.deliver;
                    data.deliver = seek;
                    data.arrived = true;
                }
            }
            else
            {
                // Have the drone slowly start moving based on time passed
                data.timePassed += deltaTime;
                data.timePassed = Math.max(data.timePassed, this.secondsToTurn);
                vec3.scale(DESIRED_VELOCITY, DESIRED_VELOCITY, Math.max(data.timePassed, this.secondsToTurn) / this.secondsToTurn);
            }
            vec3.add(agent.acceleration, agent.acceleration, DESIRED_VELOCITY);
            vec3.subtract(agent.acceleration, agent.acceleration, agent.velocity);
        }

        return NO_FORCES;
    }

    /** Carbon method AddLocatorSet (MAP_METHOD_AND_WRAP). */
    AddLocatorSet()
    {
        const seek = new EveLocatorSets();
        seek.SetName("seek");
        const deliver = new EveLocatorSets();
        deliver.SetName("deliver");
        this.locatorSet.push(seek, deliver);
    }

    /** Carbon BackAndForth::SetParent (cpp:348-354). */
    SetParent(parent)
    {
        this.parent = parent ?? null;
    }

    // Carbon GetLocatorsForSet (cpp:322-332): first locator set with the name.
    /**
      * The locators of the first locator set matching a name, or null when none matches.
      */
    _GetLocatorsForSet(setName)
    {
        for (const set of this.locatorSet)
        {
            if (set?.HasName?.(setName))
            {
                return set.GetLocators();
            }
        }
        return null;
    }

    /**
      * Carbon GetParentLocatorPosition (BackAndForth.cpp:356-363): null-guard
      * the parent, then the world position and direction of its indexed locator
      * from the behaviour's named set, into the caller's two out-vectors.
      */
    GetParentLocatorPosition(locatorIndex, outPosition, outDirection)
    {
        this._ReadOwnerLocator(this.parent, locatorIndex, outPosition, outDirection);
    }

    /** Carbon GetTargetLocatorPosition (cpp:365-372): the target twin. */
    GetTargetLocatorPosition(locatorIndex, outPosition, outDirection)
    {
        this._ReadOwnerLocator(this.target, locatorIndex, outPosition, outDirection);
    }

    /** The shared body of the pair above; the owner duck is the runtime's
      *  locator-set surface (GetLocatorPositionFromSet/GetLocatorRotationFromSet). */
    _ReadOwnerLocator(owner, locatorIndex, outPosition, outDirection)
    {
        if (owner)
        {
            owner.GetLocatorPositionFromSet?.(locatorIndex, true, this.locatorSetName, outPosition);
            owner.GetLocatorRotationFromSet?.(locatorIndex, true, this.locatorSetName, outDirection);
        }
    }

    /**
      * Reads the world position and forward direction of an owner's currently indexed locator into the agent's scratch record.
      */
    _GetOwnerLocatorPosition(owner, data)
    {
        this._ReadOwnerLocator(owner, data.locatorIndex, data.locatorTarget, data.locatorDirection);
    }

    static LocatorType = LocatorType;

}
