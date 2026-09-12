// Source: trinity/trinity/Eve/SpaceObject/Children/Behaviors/ProcessLifetime.h
//   trinity/trinity/Eve/SpaceObject/Children/Behaviors/ProcessLifetime.cpp
// Maintained CarbonEngineJS implementation; generated schema is reference-only.
import { meta } from "utils";
import { IBehavior } from "./IBehavior";
import { quat } from "math";
import { vec3 } from "math";
import {
    BELIST_EVENTMASK,
    BELIST_INSERTED,
    BELIST_LOADFINISHED,
    BELIST_REMOVED
} from "./listEvents";
import { ProcessLifetimeData } from "./ProcessLifetimeData";
import { ProcessPriority, TunnelGroupType } from "./enums";

// Module scratch for the per-agent loop (behavior updates run sequentially).
const Z_AXIS = vec3.fromValues(0, 0, 1);
const TARGET_VECTOR = vec3.create();
const VECTOR_BETWEEN = vec3.create();
const VECTOR_PROJ = vec3.create();
const OFFSET = vec3.create();
const DESIRED_NORMALIZED = vec3.create();
const TARGET_NORMALIZED = vec3.create();
const BLEND_VECTOR = vec3.create();
const PULL_FORCE = vec3.create();
const FORCE_OFFSET = vec3.create();
const SPAWN_POSITION = vec3.create();
const SPAWN_ROTATION = vec3.create();

/** ProcessLifetime (eve/child/behaviors) - generated from schema shapeHash 1fd3ebfa.... */

@meta.define("ProcessLifetime", true)
export class ProcessLifetime extends IBehavior
{
    static ProcessPriority = ProcessPriority;

    /** m_priority (int32_t) [READWRITE, PERSIST, NOTIFY, ENUM] */
    @meta.int32
    behaviorPriority = 0;

    /** m_splineTunnels (PSplineTunnelGroupVector) [READ, PERSIST, NOTIFY] */
    @meta.list("SplineTunnelGroup")
    splineTunnels = [];

    /** m_respawnAgentsOnDeath (bool) [READWRITE, PERSIST] */
    @meta.boolean
    respawnAgentsOnDeath = true;

    /** m_firstAgentLifetime (float) [READ] */
    @meta.float
    firstAgentLifetime = 0;

    /** m_returningAge (float) [READWRITE, PERSIST] */
    @meta.float
    returningAge = -1;

    /** m_wanderAmount (float) [READWRITE, PERSIST, NOTIFY] */
    @meta.float
    wanderAmount = 0.3;

    /** m_firstSpawnAtRandomPlaces (bool) [READWRITE, PERSIST, NOTIFY] */
    @meta.boolean
    firstSpawnAtRandomPlaces = true;

    /** m_behaviorWeight (float) [READWRITE, PERSIST] */
    @meta.float
    behaviorWeight = 900;

    /** m_exit (bool) [READWRITE] */
    @meta.boolean
    exit = false;

    // Flattened tunnel pointers: system tunnels first, then local group
    // tunnels (Carbon m_privateTunnels).
    _privateTunnels = [];

    // Carbon m_shouldReassignTunnelIDs/m_intialSpawn/m_desiredVector state.
    _shouldReassignTunnelIDs = true;

    _intialSpawn = false;

    _desiredVector = vec3.create();

    _returnForces = [];

    _dronesThatDie = [];

    _tunnelGroupSnapshot = [];

    /** Carbon ProcessLifetime::Initialize (cpp:33-38). */
    Initialize()
    {
        this._intialSpawn = this.firstSpawnAtRandomPlaces;
        this._WireTunnelGroups();
        this.UpdateTunnelRegistry();
        return true;
    }

    /** Carbon ProcessLifetime::OnListModified. */
    // Browser adaptation: Detaches removed groups instead of preserving Carbon's erroneous callback reattachment, and accepts portable Blue-list event arguments.
    OnListModified(event, _key = 0, _key2 = 0, value = null, list = null)
    {
        if (list !== this.splineTunnels) return;
        const maskedEvent = Number(event) & BELIST_EVENTMASK;
        if (maskedEvent === BELIST_REMOVED)
        {
            value?.SetSystemTunnelFunctionReferenceAndColor?.(null, 0xff5555aa);
        }
        else if (![ BELIST_INSERTED, BELIST_LOADFINISHED ].includes(maskedEvent))
        {
            this.UpdateTunnelRegistry();
            return;
        }
        this._WireTunnelGroups();
        this.UpdateTunnelRegistry();
    }

    /** Carbon ProcessLifetime::OnModified (cpp:27-31). */
    OnValueChanged(_value = null)
    {
        this.UpdateTunnelRegistry();
        return true;
    }

    /** Carbon ProcessLifetime::GetProcessPriority (cpp:74-77). */
    GetProcessPriority()
    {
        return this.behaviorPriority;
    }

    /** Carbon ProcessLifetime::GetBehaviorName (cpp:79-82). */
    GetBehaviorName()
    {
        return "ProcessLifetime";
    }

    /** Per-agent scratch record count (Carbon sizeof(ProcessLifetimeData)). */
    // Browser adaptation: Carbon returns a byte size; the JS port models scratch as one plain record per agent, so any non-zero value means 'has scratch'.
    GetScratchMemorySize()
    {
        return 1;
    }

    /** Fresh per-agent scratch record (Carbon ProcessLifetimeData placement init). */
    // Browser adaptation: Carbon initializes caller-provided raw memory; the JS port returns the fresh record instead.
    InitializeScratch()
    {
        return new ProcessLifetimeData();
    }

    /** Carbon IBehavior::UpdateState override (h:59-62). */
    UpdateState(state)
    {
        this.exit = !!state;
    }

    /**
      * The drone lifecycle state machine: spawns each agent at an entrance
      * tunnel, flies it through its assigned entry tunnel, and - once m_exit or
      * m_returningAge triggers - assigns the closest exit tunnel, flies it out,
      * removes it, and optionally respawns it (Carbon CalculateBehavior,
      * cpp:94-213).
      * @param {Array} agents - DroneAgent records
      * @param {Array} scratchData - per-agent ProcessLifetimeData records
      * @param {Number} deltaTime
      * @param {Object} group - owning BehaviorGroup
      * @param {Object} system - owning EveChildBehaviorSystem
      * @param {Array} _dronesInSearchRadius - unused
      * @returns {Array} debug force pairs when group.collectForces is on
      */
    // Browser adaptation: rand() maps to Math.random; debug force pairs are only collected when group.collectForces is set to keep the per-agent loop allocation-free.
    CalculateBehavior(agents, scratchData, deltaTime, group, system, _dronesInSearchRadius)
    {
        for (const group of this.splineTunnels) group.GetTunnels();
        if (!this._TunnelGroupsMatchSnapshot())
        {
            this._WireTunnelGroups();
            this.UpdateTunnelRegistry();
        }
        if (this._shouldReassignTunnelIDs)
        {
            // JS has no Blue list notify, so the local tunnel list refreshes here
            // before the system tunnels are prepended (Carbon relies on
            // OnListModified having filled m_privateTunnels already).
            this.UpdateTunnelRegistry();
            this._ReassignTunnelIDsAndAddSystemTunnels(system);
        }

        const forceVectors = this._returnForces;
        forceVectors.length = 0;
        const dronesThatDie = this._dronesThatDie;
        dronesThatDie.length = 0;

        for (let index = 0; index < agents.length; index++)
        {
            const drone = agents[index];
            const data = scratchData?.[index];
            if (!data)
            {
                continue;
            }

            if (drone.lifetime <= deltaTime && !this._intialSpawn)
            {
                this._FindASpawnPoint(drone, data, group);
            }

            // find an initial spawn position
            if (!data.hasSpawned && this._intialSpawn)
            {
                vec3.copy(SPAWN_POSITION, group.spawnPosition);
                const systemTunnels = system.GetSplineTunnels?.() ?? [];
                if (this._FindInitialSpawnPoint(drone, data, SPAWN_POSITION, systemTunnels))
                {
                    vec3.copy(group.spawnPosition, SPAWN_POSITION);
                }
                data.hasSpawned = true;
            }

            vec3.set(this._desiredVector, 0, 0, 0);

            if (!data.hasUsedEntryTunnel)
            {
                if (data.assignedLifeTimeTunnel === -1)
                {
                    data.hasUsedEntryTunnel = true;
                }
                else if (data.assignedLifeTimeTunnel >= this._privateTunnels.length)
                {
                    data.hasUsedEntryTunnel = true;
                }
                else if (this._privateTunnels.length > 0)
                {
                    if (data.assignedLifeTimeTunnel < this._privateTunnels.length &&
                        this._ProcessTunnel(drone, this._privateTunnels[data.assignedLifeTimeTunnel], data, group.GetBoundingSphereRadius()))
                    {
                        data.tunnelPoint = 0;
                        data.hasUsedEntryTunnel = true;
                        data.assignedLifeTimeTunnel = -1;
                    }
                }
            }

            if (this.exit || (this.returningAge !== -1 && drone.lifetime > this.returningAge))
            {
                // If the drone has exited then remove it
                if (data.hasUsedExitTunnel)
                {
                    dronesThatDie.push(index);
                }
                else if (data.assignedLifeTimeTunnel === -1)
                {
                    this._FindAndAssignAnExitTunnel(drone, data);
                }
                else if (this._privateTunnels.length > 0 &&
                    data.assignedLifeTimeTunnel < this._privateTunnels.length &&
                    this._ProcessTunnel(drone, this._privateTunnels[data.assignedLifeTimeTunnel], data, group.GetBoundingSphereRadius()))
                {
                    data.hasUsedExitTunnel = true;
                    dronesThatDie.push(index);
                }
            }

            if (vec3.squaredLength(this._desiredVector) === 0)
            {
                continue;
            }

            vec3.normalize(PULL_FORCE, this._desiredVector);

            if (group.collectForces)
            {
                vec3.scale(FORCE_OFFSET, PULL_FORCE, group.GetBoundingSphereRadius());
                forceVectors.push(vec3.add(vec3.create(), drone.position, FORCE_OFFSET));
            }

            vec3.scale(PULL_FORCE, PULL_FORCE, this.behaviorWeight);

            if (group.collectForces)
            {
                forceVectors.push(vec3.clone(PULL_FORCE));
            }

            vec3.add(drone.acceleration, drone.acceleration, PULL_FORCE);
        }

        this._intialSpawn = false;

        for (let i = dronesThatDie.length - 1; i >= 0; i--)
        {
            group.RemoveSpecificAgent(dronesThatDie[i]);
            if (this.respawnAgentsOnDeath)
            {
                group.AddAgent();
            }
        }

        // debug
        if (agents.length !== 0)
        {
            this.firstAgentLifetime = agents[0].lifetime;
        }

        return forceVectors;
    }

    /**
      * Rebuilds the local tunnel list from this behavior's own spline tunnel
      * groups and flags the ID reassignment (Carbon UpdateTunnelRegistry,
      * cpp:446-462).
      */
    OnSystemTunnelsChanged() { this.UpdateTunnelRegistry(); }

    UpdateTunnelRegistry()
    {
        this._privateTunnels.length = 0;
        for (const tunnelGroup of this.splineTunnels)
        {
            const tunnels = tunnelGroup?.GetTunnels?.() ?? tunnelGroup?.tunnels;
            if (!Array.isArray(tunnels))
            {
                continue;
            }
            for (const tunnel of tunnels)
            {
                this._privateTunnels.push(tunnel);
            }
        }
        this._shouldReassignTunnelIDs = true;
    }

    /** Adds Carbon's spline-tunnel debug option. */
    // Browser adaptation: Tr2DebugRendererOptions is represented by an injected Set-like option bag.
    GetDebugOptions(options = new Set())
    {
        if (options?.add) options.add("SplineTunnels");
        else options?.insert?.("SplineTunnels");
        return options;
    }

    /** Delegates local tunnel debug geometry when its option is enabled. */
    // Browser adaptation: ITr2DebugRenderer2 is an injected engine-owned capability.
    RenderDebugInfo(renderer, _agents, parentWorldLocation)
    {
        if (!renderer?.HasOption?.(this, "SplineTunnels")) return;
        for (const group of this.splineTunnels)
        {
            group?.RenderDebugInfo?.(renderer, parentWorldLocation);
        }
    }

    /**
      * First positions of every entrance tunnel; used by SpawnDrones to pick
      * timed spawn points (Carbon GetEntrancePoints, cpp:428-444).
      */
    GetEntrancePoints()
    {
        const entrancePoints = [];
        for (const tunnel of this._privateTunnels)
        {
            if (tunnel.tunnelGroupType === TunnelGroupType.ENTRANCE_TUNNELS)
            {
                if (tunnel.splinePoints.length !== 0)
                {
                    entrancePoints.push(vec3.clone(tunnel.splinePoints[0].pos));
                }
            }
        }
        return entrancePoints;
    }

    // Prepends the system-wide tunnels and reassigns sequential IDs (Carbon
    // ReassignTunnelIDsAndAddSystemTunnels, cpp:464-494).

    /**
      * Prepends the system-wide tunnels to this behavior's local ones and renumbers
      * every tunnel's tunnelID to its index in that flattened list (Carbon
      * ReassignTunnelIDsAndAddSystemTunnels, cpp:464-494), then clears the
      * reassignment flag - the IDs agent scratch records store are indices into
      * exactly this list.
      */
    _ReassignTunnelIDsAndAddSystemTunnels(system)
    {
        const localTunnels = this._privateTunnels.slice();
        const systemTunnels = Array.from(system.GetTunnels?.() ?? []);
        this._privateTunnels.length = 0;
        this._privateTunnels.push(...systemTunnels, ...localTunnels);
        for (let id = 0; id < this._privateTunnels.length; id++)
        {
            this._privateTunnels[id].tunnelID = id;
        }
        this._shouldReassignTunnelIDs = false;
    }

    // Steers the agent through one tunnel; returns true when it passed the last
    // point (Carbon ProcessTunnel, cpp:220-299). Mutates data.tunnelPoint and
    // this._desiredVector.

    /**
      * Steers one agent toward the next spline point of a tunnel, adding a random
      * offset within the tunnel cylinder so drones wander while transiting (Carbon
      * ProcessTunnel, cpp:220-299); returns true once the agent has passed the
      * tunnel's last point. Mutates the agent's scratch tunnelPoint and the
      * behavior's shared desired vector.
      */
    _ProcessTunnel(agent, tunnel, data, boundingSphere)
    {
        const points = tunnel.splinePoints;
        if (points.length === 0)
        {
            return false;
        }

        // if we've reached the end of the tunnel
        if (data.tunnelPoint === points.length)
        {
            return true;
        }
        const pointID = data.tunnelPoint;
        const point = points[pointID];
        if (!point)
        {
            return false;
        }

        vec3.subtract(TARGET_VECTOR, point.pos, agent.position);

        // Carbon compares against *begin()/*end() by value; the intent is the
        // first/last spline point.
        if (pointID === 0)
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
            const dotProd = vec3.dot(TARGET_VECTOR, VECTOR_BETWEEN);
            vec3.scale(VECTOR_PROJ, VECTOR_BETWEEN, dotProd / (lengthBetweenPoints * lengthBetweenPoints));
            vec3.subtract(OFFSET, VECTOR_PROJ, TARGET_VECTOR);
            vec3.normalize(OFFSET, OFFSET);
            vec3.scale(OFFSET, OFFSET, tunnel.cylWidth / 2);

            // add a random offset so drones wander around the tunnel while seeking
            // the next point (Carbon cpp:253-257, uniform in +-cylWidth*wander)
            const wanderSpan = tunnel.cylWidth * this.wanderAmount;
            for (let i = 0; i < 3; i++)
            {
                OFFSET[i] += -wanderSpan + Math.random() * 2 * wanderSpan;
            }

            vec3.add(TARGET_VECTOR, TARGET_VECTOR, OFFSET);
        }

        if (pointID === points.length - 1)
        {
            vec3.copy(this._desiredVector, point.rot);

            // the Dot product is positive if the agent is facing the target point
            if (vec3.dot(TARGET_VECTOR, agent.rotation) < 0 || vec3.length(TARGET_VECTOR) > 2 * lengthBetweenPoints)
            {
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

            vec3.normalize(TARGET_NORMALIZED, TARGET_VECTOR);
            vec3.add(BLEND_VECTOR, point.rot, TARGET_VECTOR);
            vec3.normalize(BLEND_VECTOR, BLEND_VECTOR);
            vec3.scale(this._desiredVector, TARGET_NORMALIZED, 0.8 * (1 - blendingMod));
            vec3.scaleAndAdd(this._desiredVector, this._desiredVector, BLEND_VECTOR, (1 - 0.8) * blendingMod);

            vec3.normalize(DESIRED_NORMALIZED, this._desiredVector);
            if (vec3.dot(TARGET_NORMALIZED, DESIRED_NORMALIZED) < 0.8)
            {
                vec3.copy(this._desiredVector, TARGET_VECTOR);
            }

            if ((lengthFromShip - boundingSphere) < tunnel.cylWidth / 1.5)
            {
                data.tunnelPoint++;
            }
        }

        return false;
    }

    // Assigns the exit tunnel whose entry point is closest to the agent (Carbon
    // FindAndAssignAnExitTunnel, cpp:301-327).

    /**
      * Assigns the agent the exit tunnel whose first spline point is closest to it,
      * or marks the exit as already used when no exit tunnel exists so the agent is
      * removed instead (Carbon FindAndAssignAnExitTunnel, cpp:301-327).
      */
    _FindAndAssignAnExitTunnel(agent, data)
    {
        let closestPointIndex = -1;
        let lengthSqToClosestPoint = -1;
        let index = 0;
        for (const tunnel of this._privateTunnels)
        {
            if (tunnel.tunnelGroupType === TunnelGroupType.EXIT_TUNNELS && tunnel.splinePoints.length !== 0)
            {
                vec3.subtract(TARGET_VECTOR, tunnel.splinePoints[0].pos, agent.position);
                const lengthSq = vec3.squaredLength(TARGET_VECTOR);
                if (lengthSqToClosestPoint === -1 || lengthSq < lengthSqToClosestPoint)
                {
                    lengthSqToClosestPoint = lengthSq;
                    closestPointIndex = index;
                }
            }
            index++;
        }
        if (closestPointIndex !== -1)
        {
            data.assignedLifeTimeTunnel = closestPointIndex;
        }
        else
        {
            data.hasUsedExitTunnel = true;
        }
    }

    // Places the very first spawn somewhere along a random entrance tunnel's
    // curve (Carbon FindInitialSpawnPoint, cpp:329-388).

    /**
      * Places the very first spawn at a random time along a random entrance tunnel's curve, ageing the agent by the fraction of the tunnel it skipped and setting the spline point it resumes from (Carbon FindInitialSpawnPoint, cpp:329-388). Prefers this behavior's own tunnel groups and falls back to the system-wide ones.
      * @param {Float32Array} pos - caller-owned; receives the chosen spawn position
      * @returns {Boolean} false when no entrance tunnel with loaded curves is available
      */
    _FindInitialSpawnPoint(drone, data, pos, systemTunnels)
    {
        // if we have local tunnels use them, otherwise use system-wide ones
        let tunnels;
        if (this.splineTunnels.length !== 0)
        {
            tunnels = this.splineTunnels;
        }
        else if (systemTunnels.length !== 0)
        {
            tunnels = systemTunnels;
        }
        else
        {
            return false;
        }

        // pick a random splineTunnel
        const splineTunnel = tunnels[Math.floor(Math.random() * tunnels.length)];

        const curveSets = splineTunnel?.GetCurveSets?.() ?? splineTunnel?.curveSets ?? [];

        // return early if there are no curves or the curves aren't loaded
        if (curveSets.length === 0)
        {
            return false;
        }

        const groupType = splineTunnel.GetTunnelGroupType?.() ?? splineTunnel.tunnelGroupType;
        if (groupType === TunnelGroupType.ENTRANCE_TUNNELS)
        {
            // we can have more than 1 curve so pick a random curve
            const curve = curveSets[Math.floor(Math.random() * curveSets.length)];
            if (!curve?.Length || !curve?.GetValue)
            {
                return false;
            }

            // get random time
            const length = Math.trunc(Number(curve.Length()) || 0);
            const time = Math.floor(Math.random() * (length + 1));

            // get value at time
            const value = curve.GetValue(time, pos);
            if (value && value !== pos)
            {
                vec3.copy(pos, value);
            }

            const stepSize = length !== 0 ? time / length : 0;

            // Get the next pointID
            const breakPoints = Number(splineTunnel.GetNumBreakPoints?.() ?? splineTunnel.breakPoints ?? 0);
            const pointID = Math.floor(stepSize * breakPoints + 1) + 0.5;

            vec3.copy(drone.position, pos);
            drone.lifetime += stepSize * pointID;
            data.tunnelPoint = Math.trunc(pointID);

            return true;
        }
        return false;
    }

    // Picks a jittered entrance point for a respawning drone and assigns it the
    // matching tunnel (Carbon FindASpawnPoint, cpp:390-426). The candidate
    // lists are allocated here - a respawn event, not the steady per-frame path.

    /**
      * Picks a random entrance tunnel for a respawning agent, jitters its first
      * spline point within that tunnel's point-of-no-return size, moves the agent
      * and the group's spawn position there, orients the agent along the point's
      * direction and assigns it the matching tunnel (Carbon FindASpawnPoint,
      * cpp:390-426); the candidate lists are allocated here because this is a
      * respawn event, not the steady per-frame path.
      */
    _FindASpawnPoint(agent, data, group)
    {
        const potentialPoints = [];
        const potentialRotations = [];
        const tunnelIndex = [];

        for (const tunnel of this._privateTunnels)
        {
            if (tunnel.tunnelGroupType === TunnelGroupType.ENTRANCE_TUNNELS && tunnel.splinePoints.length !== 0)
            {
                const point = vec3.clone(tunnel.splinePoints[0].pos);
                for (let i = 0; i < 3; i++)
                {
                    point[i] += -tunnel.pointOfNoReturnSize + Math.random() * 2 * tunnel.pointOfNoReturnSize;
                }
                potentialPoints.push(point);
                potentialRotations.push(tunnel.splinePoints[0].rot);
                tunnelIndex.push(tunnel.tunnelID);
            }
        }

        if (potentialPoints.length === 0)
        {
            return;
        }

        const randomNbr = Math.floor(Math.random() * potentialPoints.length);
        vec3.copy(group.spawnPosition, potentialPoints[randomNbr]);
        vec3.copy(agent.position, potentialPoints[randomNbr]);
        vec3.normalize(SPAWN_ROTATION, potentialRotations[randomNbr]);
        if (vec3.squaredLength(SPAWN_ROTATION) > 0)
        {
            quat.rotationTo(agent.rotation, Z_AXIS, SPAWN_ROTATION);
        }

        data.assignedLifeTimeTunnel = tunnelIndex[randomNbr];
    }

    /**
      * Snapshots the current spline tunnel group list and hands each group the
      * callback that rebuilds this behavior's tunnel registry when the group's own
      * contents change.
      */
    _WireTunnelGroups()
    {
        for (const group of this._tunnelGroupSnapshot) if (!this.splineTunnels.includes(group)) group.SetSystemTunnelFunctionReferenceAndColor(null);
        this._tunnelGroupSnapshot = this.splineTunnels.slice();
        for (const group of this.splineTunnels)
        {
            group?.SetSystemTunnelFunctionReferenceAndColor?.(
                () => this.UpdateTunnelRegistry(),
                0xff5555aa
            );
        }
    }

    /**
      * Whether the spline tunnel group list still matches the snapshot taken when
      * the groups were last wired; the per-frame mismatch check stands in for
      * Carbon's Blue list change notifications, which JavaScript does not receive.
      */
    _TunnelGroupsMatchSnapshot()
    {
        return (
            this._tunnelGroupSnapshot.length === this.splineTunnels.length &&
            this._tunnelGroupSnapshot.every((group, index) => group === this.splineTunnels[index])
        );
    }

}
