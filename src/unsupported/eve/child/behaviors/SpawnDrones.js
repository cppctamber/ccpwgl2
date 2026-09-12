// Source: trinity/trinity/Eve/SpaceObject/Children/Behaviors/SpawnDrones.h
//   trinity/trinity/Eve/SpaceObject/Children/Behaviors/SpawnDrones.cpp
// Hand-maintained from Carbon source, promoted out of generated intake.
import { meta } from "utils";
import { IBehavior } from "./IBehavior";
import { vec3 } from "math";
import { vec4 } from "math";

const NO_FORCES = [];

/** A steering behaviour that populates and repopulates a drone group's agents, either regenerating a jittered spawn grid or spawning agents by count on a schedule or one-shot trigger. */

@meta.define("SpawnDrones", true)
export class SpawnDrones extends IBehavior
{

    /** m_gridSpacing (Vector3) [READWRITE, PERSIST] */
    @meta.vector3
    gridSpacing = vec3.create();

    /** m_gridFullnessFactor (float) [READWRITE, PERSIST, NOTIFY] */
    @meta.float
    gridFullnessFactor = 1;

    /** m_regenerateDrones (bool) [READWRITE] */
    @meta.boolean
    regenerateDrones = true;

    /** m_count (int) [READWRITE, PERSIST] */
    @meta.int32
    count = 1;

    /** m_seconds (float) [READWRITE, PERSIST] */
    @meta.float
    seconds = -1;

    /** m_addOnGrid (bool) [READWRITE, PERSIST] */
    @meta.boolean
    addOnGrid = false;

    /** m_addByCount (bool) [READWRITE, PERSIST] */
    @meta.boolean
    addByCount = false;

    /** m_enabled (bool) [READWRITE, PERSIST] */
    @meta.boolean
    enabled = true;

    /** m_time (float) [READ, PERSIST] */
    @meta.float
    time = 0;

    /** m_spawnPosition (Vector3) [READWRITE, PERSIST] */
    @meta.vector3
    spawnPosition = vec3.create();

    /** m_gridInfo (Vector4) [READWRITE, PERSIST, NOTIFY] */
    @meta.vector4
    gridInfo = vec4.fromValues(1, 1, 1, 10);

    /**
      * Regenerates the group as a jittered grid of agents around the group's
      * spawn position (Carbon UpdateGrid, cpp:26-85). Grid spawn points are
      * allocated here - a regeneration event, not the per-frame path.
      * @param {Object} group - owning BehaviorGroup
      */
    // Browser adaptation: TriRand maps to Math.random; the spawn-point grid walk is ported verbatim.
    UpdateGrid(group)
    {
        // for behaviors to work we always have to add one decoy drone; delete it
        // so it doesn't mess up the cube
        for (let i = 0; i < group.GetCount(); i++)
        {
            group.SetCount(0);
        }

        const startPos = vec3.clone(group.spawnPosition);
        const position = vec3.clone(startPos);
        const xCount = Math.trunc(this.gridInfo[0]);
        const yCount = Math.trunc(this.gridInfo[1]);
        const zCount = Math.trunc(this.gridInfo[2]);

        const distBetween = vec3.fromValues(this.gridInfo[3], this.gridInfo[3], this.gridInfo[3]);
        if (vec3.squaredLength(this.gridSpacing) !== 0)
        {
            vec3.copy(distBetween, this.gridSpacing);
        }
        let fullnessFactor = this.gridFullnessFactor;

        const spawnPoints = [];

        for (let i = 0; i < zCount; i++)
        {
            for (let j = 0; j < yCount; j++)
            {
                for (let k = 0; k < xCount; k++)
                {
                    // sometimes we may want to randomize the fullness
                    if (this.gridFullnessFactor === -1)
                    {
                        fullnessFactor = Math.random();
                    }
                    // the higher the gridRandomFactor the more full the grid should be
                    if (Math.random() <= fullnessFactor)
                    {
                        spawnPoints.push(vec3.clone(position));
                    }

                    position[0] += distBetween[0];
                }
                position[1] += distBetween[1];
                position[0] = startPos[0];
            }
            position[2] += distBetween[2];
            position[1] = startPos[1];
        }

        if (spawnPoints.length !== 0)
        {
            group.AddAgents(spawnPoints);
        }
        this.regenerateDrones = false;
        // reset the spawn position to zero because otherwise it will offset
        // every group on the next spawn
        vec3.set(group.spawnPosition, 0, 0, 0);
    }

    /**
      * Spawn scheduling: one-shot grid spawns, one-shot count spawns, and timed
      * respawns at ProcessLifetime entrance points (Carbon CalculateBehavior,
      * cpp:87-146).
      * @param {Array} _agents - DroneAgent records (unused)
      * @param {Array|null} _scratchData - unused (no scratch)
      * @param {Number} deltaTime
      * @param {Object} group - owning BehaviorGroup
      * @param {Object} _system - owning EveChildBehaviorSystem
      * @param {Array} _dronesInSearchRadius - unused
      * @returns {Array} empty (as Carbon)
      */
    // Browser adaptation: rand() maps to Math.random when picking the timed entrance point; the spawn scheduling is ported verbatim.
    CalculateBehavior(_agents, _scratchData, deltaTime, group, _system, _dronesInSearchRadius)
    {
        if (!this.enabled)
        {
            return NO_FORCES;
        }

        if (this.addOnGrid && this.regenerateDrones)
        {
            this.UpdateGrid(group);
            return NO_FORCES;
        }

        // If m_addByCount is toggled on the behavior adds agents by count
        if (this.addByCount === true)
        {
            group.AddAgents(this._MakeSpawnPoints(group.spawnPosition));
            this.addByCount = false;
        }

        if (this.seconds <= 0)
        {
            return NO_FORCES;
        }

        this.time += deltaTime;

        if (this.time > this.seconds && this.seconds >= 0)
        {
            const behavior = group.GetBehaviorByName("ProcessLifetime");
            if (behavior !== null)
            {
                const spawnPoints = behavior.GetEntrancePoints?.();
                if (Array.isArray(spawnPoints) && spawnPoints.length !== 0)
                {
                    const randomNbr = Math.floor(Math.random() * spawnPoints.length);
                    vec3.copy(this.spawnPosition, spawnPoints[randomNbr]);
                }
            }

            vec3.copy(group.spawnPosition, this.spawnPosition);

            group.AddAgents(this._MakeSpawnPoints(group.spawnPosition));

            this.time = 0;
        }

        return NO_FORCES;
    }

    /** Carbon method gridToggleReset -> GridToggleReset (MAP_METHOD_AND_WRAP). */
    gridToggleReset()
    {
        this.regenerateDrones = true;
    }

    // Carbon's spawnPoints.resize(m_count, value) equivalent: m_count copies of
    // the spawn position (spawn-event allocation, not the per-frame path).
    /**
      * Builds an array of cloned copies of one spawn position, ready to be added as new agents.
      */
    _MakeSpawnPoints(position)
    {
        const spawnPoints = [];
        for (let i = 0; i < this.count; i++)
        {
            spawnPoints.push(vec3.clone(position));
        }
        return spawnPoints;
    }

}
