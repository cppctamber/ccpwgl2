// Source: trinity/trinity/Eve/SpaceObject/Children/Behaviors/SeekTarget.h
// Hand-maintained from Carbon source, promoted out of generated intake.
import { meta } from "utils";
import { IBehavior } from "./IBehavior";
import { vec3, quat } from "math";
import { EveLocatorSets } from "eve/item/EveLocatorSets";

/** A steering behaviour that assigns drones to repair locators on a target ship, splitting the target's bounding box into buckets so damage-seeking agents distribute evenly across it. */

@meta.define("SeekTarget", true)
export class SeekTarget extends IBehavior
{

    _counter = 0;

    _doneRepairing = false;

    _droneArrived = false;

    _boundingBoxes = [];

    _locatorBucketIndices = [];

    _sortedLocators = false;

    /** m_priority (int32_t) [READWRITE, PERSIST, NOTIFY, ENUM] */
    @meta.int32
    behaviorPriority = 0;

    /** m_behaviorWeight (float) [READWRITE, PERSIST] */
    @meta.float
    behaviorWeight = 1200;

    /** m_distFromOrigin (float) [READWRITE, PERSIST] */
    @meta.float
    distFromOrigin = 10;

    /** m_arrivedRadius (float) [READWRITE, PERSIST] */
    @meta.float
    arrivedRadius = 10;

    /** m_slowDownRadius (float) [READWRITE, PERSIST] */
    @meta.float
    slowDownRadius = 33;

    /** m_target (EveSpaceObject2*) [READWRITE, PERSIST] */
    @meta.struct("EveSpaceObject2")
    target = null;

    /** m_firstSpawnAtRandomPlaces (bool) [READWRITE, PERSIST] */
    @meta.boolean
    firstSpawnAtRandomPlaces = false;

    /** m_onFirstDroneArrivedCallback (BlueScriptCallback) [READWRITE] */
    onFirstDroneArrivedCallback = null;

    /** m_totalRepairTime (float) [READWRITE] */
    @meta.float
    totalRepairTime = -1;

    /** m_seconds (float) [READWRITE] */
    @meta.float
    secondsToTurn = 0.35;

    /** m_locatorSetName (BlueSharedString) [READWRITE, PERSIST] */
    @meta.string
    locatorSetName = "damage";

    /** m_locatorSet (EveLocatorSetsPtr) [READ, PERSIST] */
    @meta.struct("EveLocatorSets")
    locatorSet = new EveLocatorSets();

    /** m_exit (bool) [READWRITE] */
    @meta.boolean
    exit = false;

    /** m_repair (bool) [READWRITE] */
    @meta.boolean
    repair = false;

    /** m_enabled (bool) [READWRITE, PERSIST] */
    @meta.boolean
    enabled = true;

    _parent = null;
    _repairTimePassed = 0;
    _startTimer = false;
    _desired = vec3.create();
    _fakePoint = vec3.create();
    _facing = vec3.create();
    _radius = vec3.create();
    _center = vec3.create();
    _returnForces = [];

    /** Carbon priority getter. */
    GetProcessPriority() { return this.behaviorPriority; }
    /** Scratch uses one JS record per agent instead of a raw byte range. */
    GetScratchMemorySize() { return 1; }
    /** Carbon SeekTargetData defaults (SeekTarget.h:13). */
    InitializeScratch()
    {
        return { bucketId: -1, locatorIndex: -1, timePassed: 0, position: vec3.create(), direction: vec3.create(), arrived: true, hasSpawned: false };
    }

    /** Retrieves this behavior's authored locator list. */
    GetLocatorsForSet(name)
    {
        return this.locatorSet && this.locatorSet.HasName(name) ? this.locatorSet.GetLocators() : null;
    }

    /** Chooses the donor's local, parent, or origin spawn position. */
    FindSpawnPoint()
    {
        const locators = this.GetLocatorsForSet(this.locatorSetName);
        if (locators && locators.length) return vec3.clone(locators[Math.floor(Math.random() * locators.length)].position);
        if (this._parent)
        {
            const count = this._parent.GetLocatorCount(this.locatorSetName);
            return this._parent.GetLocatorPositionFromSet(Math.floor(Math.random() * count), false, this.locatorSetName);
        }
        return vec3.create();
    }

    /** Carbon SeekTarget.cpp:53-272: locator arrival, repair timing and steering. */
    CalculateBehavior(agents, scratchData, deltaTime, group)
    {
        if (!this._parent) this._parent = group.GetParent();
        const forces = this._returnForces;
        forces.length = 0;
        if (!this.enabled || this.behaviorWeight <= 0) return forces;
        if (this.exit && this._counter >= 1)
        {
            this._doneRepairing = true;
            this.exit = false;
            this._counter = 0;
        }
        for (let i = 0; i < agents.length; i++)
        {
            const agent = agents[i], data = scratchData[i];
            if (!data.hasSpawned && this.firstSpawnAtRandomPlaces)
            {
                const position = this.FindSpawnPoint();
                vec3.copy(group.spawnPosition, position);
                vec3.copy(agent.position, position);
                data.hasSpawned = true;
            }
            if (this.totalRepairTime !== -1 && this._repairTimePassed >= this.totalRepairTime)
            {
                this.SetExit(true);
                this.repair = false;
                this._repairTimePassed = 0;
            }
            if (this._doneRepairing) data.arrived = true;
            if (this.repair && this.target)
            {
                if (vec3.squaredLength(agent.target) === 0 || data.locatorIndex === -1)
                {
                    if (this._sortedLocators && this._locatorBucketIndices.length)
                    {
                        data.bucketId = agent.id % this._locatorBucketIndices.length;
                        data.locatorIndex = Math.floor(Math.random() * this._locatorBucketIndices[data.bucketId].length);
                    }
                    else data.locatorIndex = Math.floor(Math.random() * this.target.GetLocatorCount(this.locatorSetName));
                }
                const locatorIndex = this._sortedLocators && this._locatorBucketIndices.length
                    ? this._locatorBucketIndices[data.bucketId][data.locatorIndex] : data.locatorIndex;
                this.target.GetLocatorPosition(data.position, locatorIndex, false, this.locatorSetName);
                this.target.GetLocatorDirection(data.direction, locatorIndex, false, this.locatorSetName);
            }
            else if (data.arrived && vec3.squaredLength(agent.target) === 0)
            {
                const locators = this.GetLocatorsForSet(this.locatorSetName);
                if (locators && locators.length)
                {
                    const locator = locators[Math.floor(Math.random() * locators.length)];
                    vec3.copy(data.position, locator.position);
                    vec3.set(data.direction, 0, 1, 0);
                    vec3.transformQuat(data.direction, data.direction, locator.rotation);
                }
                else if (this._parent)
                {
                    const index = Math.floor(Math.random() * this._parent.GetLocatorCount(this.locatorSetName));
                    this._parent.GetLocatorPosition(data.position, index, false, this.locatorSetName);
                    this._parent.GetLocatorDirection(data.direction, index, false, this.locatorSetName);
                }
                data.arrived = false;
            }
            vec3.copy(agent.target, data.position);
            if (vec3.squaredLength(data.direction) === 0) vec3.set(data.direction, 0, 1, 0);
            vec3.normalize(this._fakePoint, data.direction);
            if (this.repair && this.target)
            {
                this.target.GetShapeEllipsoid(this._center, this._radius);
                vec3.multiply(this._fakePoint, this._fakePoint, this._radius);
                vec3.scale(this._fakePoint, this._fakePoint, 1.2);
            }
            else vec3.scale(this._fakePoint, this._fakePoint, this.distFromOrigin);
            vec3.add(this._fakePoint, this._fakePoint, agent.target);
            vec3.subtract(this._desired, this._fakePoint, agent.position);
            const distance = vec3.length(this._desired);
            vec3.normalize(this._desired, this._desired);
            if (distance < this.slowDownRadius)
            {
                vec3.scale(this._desired, this._desired, distance / this.slowDownRadius);
                if (!this._droneArrived && this.onFirstDroneArrivedCallback)
                {
                    // Blue's callable callback becomes a host-provided JS function.
                    this.onFirstDroneArrivedCallback();
                    this._droneArrived = true;
                    this._doneRepairing = false;
                    if (this.repair) this._startTimer = true;
                }
                vec3.subtract(this._facing, data.position, agent.position);
                vec3.normalize(this._facing, this._facing);
                if (vec3.squaredLength(this._facing)) quat.rotationTo(agent.rotation, SeekTarget.Z_AXIS, this._facing);
                data.timePassed = 0;
                if (!agent.playFX)
                {
                    agent.fxStartTime = Date.now() / 1000;
                    agent.playFX = true;
                }
                if (distance < this.arrivedRadius) data.arrived = true;
            }
            else
            {
                // Donor quirk: max, not min; acceleration grows past the turn time.
                data.timePassed = Math.max(data.timePassed + deltaTime, this.secondsToTurn);
                vec3.scale(this._desired, this._desired, this.behaviorWeight * Math.max(data.timePassed, this.secondsToTurn) / this.secondsToTurn);
            }
            if (this.exit)
            {
                agent.playFX = false;
                this.repair = false;
                data.locatorIndex = -1;
                this._droneArrived = false;
                this._counter++;
                this._startTimer = false;
            }
            if (group.collectForces)
            {
                const force = vec3.scale(vec3.create(), this._desired, this.behaviorWeight);
                vec3.subtract(force, force, agent.velocity);
                forces.push(vec3.scaleAndAdd(vec3.create(), agent.position, force, group.GetBoundingSphereRadius()), force);
            }
            // Donor debug force applies weight again; actual steering does not.
            vec3.subtract(this._desired, this._desired, agent.velocity);
            vec3.add(agent.acceleration, agent.acceleration, this._desired);
        }
        this._doneRepairing = false;
        if (this._startTimer) this._repairTimePassed += deltaTime;
        return forces;
    }

    static Z_AXIS = vec3.fromValues(0, 0, 1);

    /** Carbon method AddLocatorSet (MAP_METHOD_AND_WRAP). */
    AddLocatorSet()
    {
        const locatorSet = new EveLocatorSets();
        locatorSet.SetName(this.locatorSetName);
        this.locatorSet = locatorSet;
    }

    /** Carbon method SetTarget (MAP_METHOD_AND_WRAP). */
    SetTarget(target)
    {
        this.target = target;
    }

    /** Carbon method ResetBehavior (MAP_METHOD_AND_WRAP). */
    ResetBehavior()
    {
        this._counter = 0;
        this.exit = false;
        this.repair = false;
        this._droneArrived = false;
        this._doneRepairing = true;
    }

    /** Carbon method SetBehaviorWeight (MAP_METHOD_AND_WRAP). */
    SetBehaviorWeight(value)
    {
        this.behaviorWeight = value;
    }

    /** Carbon method SetExit (MAP_METHOD_AND_WRAP). */
    SetExit(value)
    {
        this.exit = value;
    }

    /** Carbon method SetTotalRepairTime (MAP_METHOD_AND_WRAP). */
    SetTotalRepairTime(seconds)
    {
        this.totalRepairTime = seconds;
    }

    /** Carbon method SetupShipRepair (MAP_METHOD_AND_WRAP). */
    SetupShipRepair()
    {
        this.exit = false;
        this._droneArrived = false;
        this.repair = true;
    }

    /** Carbon method SplitBoundingBox (MAP_METHOD_AND_WRAP). */
    // Browser adaptation: Uses EveSpaceObject2's portable bounds and locator query methods, and safely handles equal or degenerate box dimensions.
    SplitBoundingBox()
    {
        this._boundingBoxes.length = 0;
        this._locatorBucketIndices.length = 0;
        this._sortedLocators = false;
        if (!this.target?.GetLocalBoundingBox)
        {
            return false;
        }

        const min = vec3.create();
        const max = vec3.create();
        if (!this.target.GetLocalBoundingBox(min, max))
        {
            return false;
        }
        const dimensions = vec3.subtract(vec3.create(), max, min);
        let maxIndex = 0;
        for (let index = 1; index < 3; index++)
        {
            if (dimensions[index] > dimensions[maxIndex])
            {
                maxIndex = index;
            }
        }
        const largest = dimensions[maxIndex];
        if (!Number.isFinite(largest) || largest <= 0)
        {
            return false;
        }
        const otherDimensions = [
            dimensions[(maxIndex + 1) % 3],
            dimensions[(maxIndex + 2) % 3]
        ];
        const secondLargest = Math.max(...otherDimensions.filter(Number.isFinite), 0);
        let desiredLength = largest;
        if (secondLargest > 0)
        {
            while (desiredLength > secondLargest)
            {
                desiredLength *= 0.5;
            }
        }
        const boxCount = secondLargest > 0
            ? Math.max(1, Math.round(largest / desiredLength))
            : 1;
        for (let index = 0; index < boxCount; index++)
        {
            const boxMin = vec3.clone(min);
            const boxMax = vec3.clone(max);
            boxMin[maxIndex] = min[maxIndex] + index * desiredLength;
            boxMax[maxIndex] = index === boxCount - 1
                ? max[maxIndex]
                : min[maxIndex] + (index + 1) * desiredLength;
            this._boundingBoxes.push({ min: boxMin, max: boxMax });
            this._locatorBucketIndices.push([]);
        }

        const locatorCount = Math.max(0, Number(this.target.GetLocatorCount?.(this.locatorSetName)) || 0);
        const position = vec3.create();
        for (let locatorIndex = 0; locatorIndex < locatorCount; locatorIndex++)
        {
            const locatorPosition = this.target.GetLocatorPositionFromSet?.(
                locatorIndex,
                false,
                this.locatorSetName,
                position
            );
            if (!locatorPosition)
            {
                continue;
            }
            for (let bucketIndex = 0; bucketIndex < this._boundingBoxes.length; bucketIndex++)
            {
                const box = this._boundingBoxes[bucketIndex];
                if (locatorPosition[0] >= box.min[0] && locatorPosition[0] <= box.max[0]
                    && locatorPosition[1] >= box.min[1] && locatorPosition[1] <= box.max[1]
                    && locatorPosition[2] >= box.min[2] && locatorPosition[2] <= box.max[2])
                {
                    this._locatorBucketIndices[bucketIndex].push(locatorIndex);
                    break;
                }
            }
        }

        for (let index = this._locatorBucketIndices.length - 1; index >= 0; index--)
        {
            if (this._locatorBucketIndices[index].length === 0)
            {
                this._locatorBucketIndices.splice(index, 1);
                this._boundingBoxes.splice(index, 1);
            }
        }
        this._sortedLocators = true;
        return true;
    }
    /**
      * A shallow copy of the locator index buckets produced by splitting the target's bounding box, one array per slice.
      */
    GetLocatorBucketIndices()
    {
        return this._locatorBucketIndices.map(bucket => [ ...bucket ]);
    }

}
