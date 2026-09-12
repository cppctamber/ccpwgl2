// Source: trinity/trinity/Eve/SpaceObject/Children/Behaviors/FollowASpline.h
//   trinity/trinity/Eve/SpaceObject/Children/Behaviors/FollowASpline.cpp
// Hand-maintained from Carbon source, promoted out of generated intake.
import { meta } from "utils";
import { IBehavior } from "./IBehavior";
import { vec3 } from "math";
import { TunnelGroupType } from "./enums";
import { BELIST_EVENTMASK, BELIST_INSERTED, BELIST_LOADFINISHED, BELIST_REMOVED } from "./listEvents";

// Module scratch for the per-agent loop (behavior updates run sequentially).
const DIST = vec3.create();
const TARGET_VECTOR = vec3.create();
const VECTOR_BETWEEN = vec3.create();
const VECTOR_PROJ = vec3.create();
const OFFSET = vec3.create();
const TARGET_NORMALIZED = vec3.create();
const BLEND_VECTOR = vec3.create();
const DESIRED_NORMALIZED = vec3.create();
const PULL_FORCE = vec3.create();
const FORCE_OFFSET = vec3.create();
const NO_FORCES = [];

/** A steering behaviour that pulls unassigned drones into spline tunnel entrances and steers locked drones along their assigned tunnel's points toward the exit. */

@meta.define("FollowASpline", true)
export class FollowASpline extends IBehavior
{

    /** Flattened CPU tunnel references used by the behavior system. */
    @meta.list("SplineTunnel")
    privateTunnels = [];

    @meta.boolean
    shouldReassignTunnelIDs = true;

    /** m_priority (int32_t) [READWRITE, PERSIST, NOTIFY, ENUM] */
    @meta.int32
    behaviorPriority = 0;

    /** m_tunnelGroupType (TunnelGroupType - enum TunnelGroupType) [READWRITE, PERSIST, ENUM] */
    @meta.int32
    tunnelGroupType = 2;

    /** m_splineTunnels (PSplineTunnelGroupVector) [READ, PERSIST] */
    @meta.list("SplineTunnelGroup")
    splineTunnels = [];

    /** m_smoothPullFactor (float) [READWRITE, PERSIST] */
    @meta.float
    smoothPullFactor = 0.8;

    /** m_behaviorWeight (float) [READWRITE, PERSIST] */
    @meta.float
    behaviorWeight = 600;

    /** m_enabled (bool) [READWRITE, PERSIST] */
    @meta.boolean
    enabled = true;

    /** m_cornerSmoothener (float) [READWRITE, PERSIST] */
    @meta.float
    cornerSmoothener = 0.8;

    // Carbon m_frameCounter/m_framesBetweenUpdates/m_lastPullForces/
    // m_targetPointVector/m_desiredVector runtime state.
    _frameCounter = 0;

    _framesBetweenUpdates = 11;

    _lastPullForces = [];

    _targetPointVector = [];

    _desiredVector = vec3.create();

    _returnForces = [];
    _knownTunnelGroups = [];

    /** Carbon FollowASpline::GetProcessPriority (cpp:32-35). */
    GetProcessPriority()
    {
        return this.behaviorPriority;
    }

    /** Carbon FollowASpline::OnModified (cpp:26-30). */
    OnValueChanged(_value = null)
    {
        this.UpdateTunnelRegistry();
        return true;
    }

    /**
      * Carbon OnListModified (FollowASpline.cpp:37-67): only the spline-tunnels
      * list is watched, and the donor's INSERTED, REMOVED and LOADFINISHED
      * branches are textually identical - each hands the group a bound
      * UpdateTunnelRegistry callback with debug colour 0xff5555aa. One body
      * here; the duplication is the donor's, not three behaviours.
      */
    OnListModified(event, _key, _key2, value, theList)
    {
        if (theList !== this.splineTunnels) return;

        const kind = event & BELIST_EVENTMASK;
        if (kind !== BELIST_INSERTED && kind !== BELIST_REMOVED && kind !== BELIST_LOADFINISHED) return;

        if (typeof value?.SetSystemTunnelFunctionReferenceAndColor === "function")
        {
            value.SetSystemTunnelFunctionReferenceAndColor(() => this.UpdateTunnelRegistry(), 0xFF5555AA);
        }
    }

    /** Per-agent scratch record count (Carbon sizeof(FollowASplineData)). */
    // Browser adaptation: Carbon returns a byte size; the JS port models scratch as one plain record per agent, so any non-zero value means 'has scratch'.
    GetScratchMemorySize()
    {
        return 1;
    }

    /** Fresh per-agent scratch record (Carbon FollowASplineData placement init). */
    // Browser adaptation: Carbon initializes caller-provided raw memory; the JS port returns the fresh record instead.
    InitializeScratch()
    {
        return {
            tunnelLock: -1,
            tunnelPoint: 0
        };
    }

    /**
      * Pulls unassigned agents into tunnel entrances, steers locked agents along
      * their tunnel points, and replays cached pull forces on skip frames
      * (Carbon CalculateBehavior, cpp:201-293).
      * @param {Array} agents - DroneAgent records
      * @param {Array} scratchData - per-agent FollowASplineData records
      * @param {Number} _deltaTime
      * @param {Object} group - owning BehaviorGroup
      * @param {Object} system - owning EveChildBehaviorSystem
      * @param {Array} _dronesInSearchRadius - unused
      * @returns {Array} debug force pairs when group.collectForces is on
      */
    // Browser adaptation: Debug force pairs are only collected when group.collectForces is set, keeping the per-agent loop allocation-free.
    CalculateBehavior(agents, scratchData, _deltaTime, group, system, _dronesInSearchRadius)
    {
        if (!this.enabled)
        {
            return NO_FORCES;
        }

        if (this._frameCounter >= this._framesBetweenUpdates)
        {
            this._frameCounter = 0;
        }
        else
        {
            this._frameCounter++;
        }

        if (this._knownTunnelGroups.length !== this.splineTunnels.length || this.splineTunnels.some((group, i) => group !== this._knownTunnelGroups[i]))
        {
            for (const group of this._knownTunnelGroups) if (!this.splineTunnels.includes(group)) group.SetSystemTunnelFunctionReferenceAndColor(null);
            this._knownTunnelGroups = this.splineTunnels.slice();
            for (const group of this.splineTunnels) group.SetSystemTunnelFunctionReferenceAndColor(() => this.UpdateTunnelRegistry(), 0xff5555aa);
            this.UpdateTunnelRegistry();
        }
        for (const group of this.splineTunnels) group.GetTunnels();
        const forceVectors = this._returnForces;
        forceVectors.length = 0;

        if (this._frameCounter === 0)
        {
            if (this.shouldReassignTunnelIDs)
            {
                // JS has no Blue list notify, so the local tunnel list refreshes here
                // before the system tunnels are prepended (Carbon relies on
                // OnListModified having filled m_privateTunnels already).
                this.remapTunnels();
                this._ReassignTunnelIDsAndAddSystemTunnels(system);
                group.InitializeGeometryResource(); // reset all agents
                return forceVectors;
            }

            this._targetPointVector.length = 0;

            let pullCount = 0;
            for (let c = 0; c < agents.length; c++)
            {
                const drone = agents[c];
                const data = scratchData?.[c];
                if (!data)
                {
                    continue;
                }

                vec3.set(this._desiredVector, 0, 0, 0);
                let rampingForce = 1;

                if (data.tunnelLock === -1)
                {
                    rampingForce = this._ProcessTunnelEntrances(drone, this.privateTunnels, data);
                }

                // tunnelLock can change in ProcessTunnelEntrances so if->else is not
                // equivalent
                if (data.tunnelLock !== -1)
                {
                    if (this._ProcessAssignedTunnel(drone, this.privateTunnels, group, data))
                    {
                        // If process returns true we update all the drones as a unit and
                        // skip if they are in a Formation
                        if (this._CheckForAndUpdateFormation(agents, group, scratchData, data.tunnelLock, data.tunnelPoint))
                        {
                            // all drones have been updated so we break
                            break;
                        }
                    }
                }

                const pullForce = this._PullForceAt(pullCount);
                pullCount++;

                if (vec3.squaredLength(this._desiredVector) === 0)
                {
                    vec3.set(pullForce, 0, 0, 0);
                    continue;
                }

                vec3.normalize(PULL_FORCE, this._desiredVector);
                if (group.collectForces)
                {
                    vec3.scale(FORCE_OFFSET, PULL_FORCE, group.GetBoundingSphereRadius());
                    forceVectors.push(vec3.add(vec3.create(), drone.position, FORCE_OFFSET));
                }
                vec3.scale(PULL_FORCE, PULL_FORCE, this.behaviorWeight * rampingForce);
                if (group.collectForces)
                {
                    forceVectors.push(vec3.clone(PULL_FORCE));
                }
                vec3.add(drone.acceleration, drone.acceleration, PULL_FORCE);
                vec3.copy(pullForce, PULL_FORCE);
            }
            this._lastPullForces.length = pullCount;
        }
        else
        {
            if (this._lastPullForces.length === 0)
            {
                return forceVectors;
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
                    forceVectors.push(vec3.add(vec3.create(), agent.position, FORCE_OFFSET));
                    forceVectors.push(vec3.clone(pullForce));
                }
                c++;
            }
        }
        return forceVectors;
    }

    /**
      * Carbon UpdateTunnelRegistry (cpp:319-335): clear the private list,
      * flatten every group's tunnels into it, and raise the reassign flag so
      * ReassignTunnelIDsAndAddSystemTunnels renumbers on the next tick.
      */
    OnSystemTunnelsChanged() { this.UpdateTunnelRegistry(); }

    UpdateTunnelRegistry()
    {
        this.privateTunnels.length = 0;
        for (const group of this.splineTunnels)
        {
            const tunnels = group?.GetTunnels?.() ?? group?.tunnels;
            if (Array.isArray(tunnels))
            {
                this.privateTunnels.push(...tunnels);
            }
        }
        this.shouldReassignTunnelIDs = true;
    }

    /** Blue exposure "remapTunnels" of UpdateTunnelRegistry (FollowASpline_Blue.cpp:37). */
    remapTunnels()
    {
        this.UpdateTunnelRegistry();
        return this.privateTunnels;
    }

    // Prepends the system-wide tunnels and reassigns sequential IDs (Carbon
    // ReassignTunnelIDsAndAddSystemTunnels, cpp:337-370).
    /**
      * Prepends the system-wide tunnels to the private tunnel list and reassigns every tunnel a sequential identifier.
      */
    _ReassignTunnelIDsAndAddSystemTunnels(system)
    {
        const tunnels = system.GetTunnels?.() ?? [];

        for (const tunnel of tunnels)
        {
            this.privateTunnels.unshift(tunnel);
        }

        let id = 0;

        if (tunnels.length !== 0)
        {
            id = tunnels[tunnels.length - 1].tunnelID;
        }

        if (this.privateTunnels.length === 0)
        {
            this.shouldReassignTunnelIDs = false;
            return;
        }

        for (const tunnel of this.privateTunnels)
        {
            tunnel.tunnelID = id;
            id++;
        }

        this.shouldReassignTunnelIDs = false;
    }

    // Pull-in test against the tunnel entrance spheres (Carbon
    // ProcessTunnelEntrances, cpp:70-104). Returns the ramping force and may
    // lock the agent to a tunnel; mutates this._desiredVector.
    /**
      * Tests an unassigned agent against each tunnel's entrance sphere, locking it to a tunnel once inside the point-of-no-return radius and otherwise building a pull force as it nears.
      */
    _ProcessTunnelEntrances(agent, tunnels, data)
    {
        // not associated with a tunnel
        for (const tunnel of tunnels)
        {
            if (tunnel.tunnelGroupType !== TunnelGroupType.OTHER_TUNNELS)
            {
                return 0;
            }

            if (tunnel.splinePoints.length === 0)
            {
                continue;
            }

            vec3.subtract(DIST, tunnel.splinePoints[0].pos, agent.position);
            const length = vec3.length(DIST);
            if (length < tunnel.pointOfNoReturnSize)
            {
                data.tunnelLock = tunnel.tunnelID;
                data.tunnelPoint = 0;
            }
            else if (length < tunnel.pullSize)
            {
                if (tunnel.pullSize === tunnel.pointOfNoReturnSize)
                {
                    continue;
                }

                // normalize the distance between outer and inner spheres to increase
                // pull-strength
                let mod = (length - tunnel.pointOfNoReturnSize) / (tunnel.pullSize - tunnel.pointOfNoReturnSize);
                mod = 1 - Math.max(0, Math.min(mod, 1));
                vec3.copy(this._desiredVector, DIST);
                return Math.min(1, Math.max(0, 1 - this.smoothPullFactor + this.smoothPullFactor * mod));
            }
        }
        return 1;
    }

    // Steers a locked agent along its tunnel (Carbon ProcessAssignedTunnel,
    // cpp:107-189). Returns true when the tunnel state advanced; mutates the
    // scratch record and this._desiredVector.
    /**
      * Steers a locked agent toward its current spline point, blending toward the next for smooth cornering, and advances or releases the lock as it arrives or drifts away.
      */
    _ProcessAssignedTunnel(agent, tunnels, group, data)
    {
        if (data.tunnelLock > tunnels.length)
        {
            return false;
        }

        const tunnel = tunnels[data.tunnelLock];
        const points = tunnel?.splinePoints;
        if (!points || points.length === 0)
        {
            return false;
        }

        const pointID = data.tunnelPoint;
        const point = points[pointID];
        if (!point)
        {
            return false;
        }

        vec3.subtract(TARGET_VECTOR, point.pos, agent.position);

        // Carbon compares the first point by value, including repeated points.
        if (vec3.exactEquals(point.pos, points[0].pos) && vec3.exactEquals(point.rot, points[0].rot) && point.accelerationMultiplier === points[0].accelerationMultiplier)
        {
            vec3.copy(VECTOR_BETWEEN, point.rot);
        }
        else
        {
            vec3.copy(VECTOR_BETWEEN, points[pointID - 1].rot);
        }

        const lengthBetweenPoints = vec3.length(VECTOR_BETWEEN);

        if (lengthBetweenPoints !== 0)
        {
            // an offset is added to the target point so they don't all follow the
            // same line
            const dotProd = vec3.dot(TARGET_VECTOR, VECTOR_BETWEEN);
            vec3.scale(VECTOR_PROJ, VECTOR_BETWEEN, dotProd / (lengthBetweenPoints * lengthBetweenPoints));
            vec3.subtract(OFFSET, VECTOR_PROJ, TARGET_VECTOR);
            vec3.normalize(OFFSET, OFFSET);
            vec3.scaleAndAdd(TARGET_VECTOR, TARGET_VECTOR, OFFSET, tunnel.cylWidth / 2);
        }

        // Carbon records every target point for debug rendering; the JS port only
        // collects them in debug (collectForces) mode to keep the loop
        // allocation-free.
        if (group.collectForces)
        {
            this._targetPointVector.push(vec3.add(vec3.create(), TARGET_VECTOR, agent.position));
        }

        // Browser correction: Carbon dereferences end(), an invalid iterator.
        // The explicit last-point check makes endpoint handling deterministic.
        if (pointID === points.length - 1)
        {
            vec3.copy(this._desiredVector, point.rot);

            // the Dot product is positive if the agent is facing the target point
            if (vec3.dot(TARGET_VECTOR, agent.rotation) < 0)
            {
                data.tunnelLock = -1;
                data.tunnelPoint = 0;
                return true;
            }
        }
        else
        {
            const lengthFromShip = vec3.length(TARGET_VECTOR);

            let blendingMod = 0;

            if (lengthBetweenPoints !== 0)
            {
                blendingMod = Math.min(1, Math.max(0, (lengthBetweenPoints - lengthFromShip) / lengthBetweenPoints));
                blendingMod = blendingMod * blendingMod;
            }
            this.cornerSmoothener = Math.min(1, Math.max(0, this.cornerSmoothener));
            vec3.normalize(TARGET_NORMALIZED, TARGET_VECTOR);
            vec3.add(BLEND_VECTOR, point.rot, TARGET_VECTOR);
            vec3.normalize(BLEND_VECTOR, BLEND_VECTOR);
            vec3.scale(this._desiredVector, TARGET_NORMALIZED, this.cornerSmoothener * (1 - blendingMod));
            vec3.scaleAndAdd(this._desiredVector, this._desiredVector, BLEND_VECTOR, (1 - this.cornerSmoothener) * blendingMod);
            vec3.normalize(DESIRED_NORMALIZED, this._desiredVector);
            if (vec3.dot(TARGET_NORMALIZED, DESIRED_NORMALIZED) < this.cornerSmoothener)
            {
                vec3.copy(this._desiredVector, TARGET_VECTOR);
            }

            if ((lengthFromShip - group.GetBoundingSphereRadius()) < tunnel.cylWidth / 1.5)
            {
                data.tunnelPoint++;
                return true;
            }

            // rework into cylinder collision
            if (lengthFromShip > (group.GetBoundingSphereRadius() + lengthBetweenPoints * 1.5) &&
                vec3.dot(TARGET_VECTOR, VECTOR_BETWEEN) < 0)
            {
                data.tunnelLock = -1;
                data.tunnelPoint = 0;
                return true;
            }
        }
        return false;
    }

    // When the group is in Formation, locks every drone to the same tunnel
    // point so they advance as a unit (Carbon CheckForAndUpdateFormation,
    // cpp:295-317).
    /**
      * Locks every agent to the same tunnel and tunnel point while the group's formation behaviour is active, so the group advances as a unit.
      */
    _CheckForAndUpdateFormation(agents, group, scratchData, tunnel, tunnelPoint)
    {
        const formation = group.GetBehaviorByName("Formation");

        if (formation && formation.InFormation?.())
        {
            for (let c = 0; c < agents.length; c++)
            {
                const data = scratchData?.[c];
                if (data)
                {
                    data.tunnelLock = tunnel;
                    data.tunnelPoint = tunnelPoint;
                }
            }
            return true;
        }
        return false;
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

    static TunnelGroupType = TunnelGroupType;

}
