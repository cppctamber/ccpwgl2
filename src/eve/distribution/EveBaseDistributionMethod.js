// Ported from CarbonEngine (MIT, (c) 2026 CCP Games) - https://github.com/carbonengine/trinity
//   trinity/trinity/Eve/SpaceObject/Utils/EveDistributionMethods/EveBaseDistributionMethod.h
import { meta } from "utils";
import { vec3, mat4 } from "math";
import { EveChildUpdateParams } from "../EveChildUpdateParams.js";
import { PlacementDataWithIdentifier } from "../PlacementDataWithIdentifier.js";
import { DistributionEntityLifeTimeEvent } from "./attributeModifiers/enums.js";


/** EveBaseDistributionMethod (eve/distribution) - generated from schema shapeHash 498ea86d.... */
@meta.type("EveBaseDistributionMethod")
@meta.ccp.define("EveBaseDistributionMethod")
export class EveBaseDistributionMethod extends meta.Model
{

    _initialPlacements = [];

    _uniqueIDIndices = new Map();

    _placementDataCenter = vec3.create();

    _playTime = 0;

    _isPlaying = true;

    _resetTransformOnUpdate = false;

    /** m_distributionModifiers (PIEveDistributionModifierVector) [READ, PERSIST] */
    @meta.list("IEveDistributionModifier")
    lifetimeModifiers = [];

    /** m_locationsCanReTrigger (bool) [READWRITE, PERSIST] */
    @meta.boolean
    locationsCanReTrigger = true;

    /** m_timeOutOnTriggering (float) [READWRITE, PERSIST] */
    @meta.float
    timeOutOnTriggering = 2;

    /** m_uniqueIDCounter (uint32_t) [READ] */
    @meta.uint
    entitiesSpawned = 0;

    /** m_numFreePlacements (uint32_t) [READ] */
    @meta.uint
    freePlacements = 0;

    /** m_playtimeMultiplier (float) [READWRITE, PERSIST] */
    @meta.float
    playtimeMultiplier = 1;

    /** m_placementGenerators (PIEveDistributionPlacementGeneratorsVector) [READ, PERSIST] */
    @meta.list("IEveDistributionPlacementGenerators")
    placementGenerators = [];

    /** m_placementData (PPlacementDataWithIdentifierStructureList) [READ] */
    @meta.list("PlacementDataWithIdentifier")
    placementData = [];

    /** m_distributionSpawnModifiers (PIEveDistributionSpawnModifierVector) [READ, PERSIST] */
    @meta.list("IEveDistributionSpawnModifier")
    spawnModifiers = [];

    /** m_distributionSpawners (PIEveDistributionSpawnerVector) [READ, PERSIST] */
    @meta.list("IEveDistributionSpawner")
    spawnTriggers = [];

    /** Carbon method AddEntity -> AddEntities (MAP_METHOD_AND_WRAP). */
    AddEntity(howMany = 1)
    {
        this.AddEntities(howMany);
    }

    /** Carbon method Restart -> RestartDistribution (MAP_METHOD_AND_WRAP). */
    Restart()
    {
        this.RestartDistribution();
    }

    /** Rebuilds the authored placement pool from every Carbon placement generator. */
    RegeneratePlacementData()
    {
        this._initialPlacements.length = 0;
        this._uniqueIDIndices.clear();

        // Carbon passes a uint32_t by reference. The mutable value object is the
        // direct JavaScript equivalent used by placement generators in this runtime.
        const trackingID = { value: 0 };
        for (const generator of this.placementGenerators)
        {
            generator.GetInitialPlacements(this._initialPlacements, trackingID);
        }

        for (let i = 0; i < this._initialPlacements.length; i++)
        {
            this._uniqueIDIndices.set(this._initialPlacements[i].placement.uniqueID, i);
        }
        this.freePlacements = this._initialPlacements.length;
    }

    /**
     * Returns how many entities are currently live, not how many placements the
     * generators authored.
     */
    GetNumberOfPlacements()
    {
        return this.placementData.length;
    }

    /**
     * Returns the live list of spawned placements; entries are mutated in place
     * each update and removed as entities are killed.
     */
    GetPlacementData()
    {
        return this.placementData;
    }

    /**
     * Returns a copy of the mean initial-plus-additional translation of the live
     * placements, recomputed on every synchronous update.
     */
    GetPlacementDataCenter()
    {
        return vec3.clone(this._placementDataCenter);
    }

    /**
     * Reports whether any lifetime modifier affects the transform, in which case
     * the per-entity additional transform is cleared and re-accumulated every
     * update.
     */
    GetHasDynamicMovement()
    {
        return this._resetTransformOnUpdate;
    }

    /** Brings the distribution into its start state by running a full restart. */
    Initialize()
    {
        this.RestartDistribution();
        return true;
    }

    /**
     * Restarts the distribution when the placement generator or spawner list
     * changes, and re-evaluates dynamic movement when the lifetime modifier list
     * changes.
     */
    OnListModified(_event, _key, _key2, _value, list)
    {
        if (list === this.placementGenerators || list === this.spawnTriggers)
        {
            this.RestartDistribution();
        }
        else if (list === this.lifetimeModifiers)
        {
            this._refreshDynamicMovement();
        }
    }

    /**
     * Drops every live entity, regenerates the placement pool from the generators,
     * resets each spawner against the new pool and clears the play time and spawn
     * counter.
     */
    RestartDistribution()
    {
        this.placementData.length = 0;
        this.RegeneratePlacementData();

        for (const spawner of this.spawnTriggers)
        {
            spawner.Reset(this._initialPlacements);
        }

        this._playTime = 0;
        this._isPlaying = true;
        this.entitiesSpawned = 0;
        this._refreshDynamicMovement();
    }

    /**
     * Advances the distribution one frame: honours any generator's regeneration request, ages the live placements by the playtime-scaled delta, applies bone transforms and lifetime modifiers, recomputes the placement centre and finally ticks the spawners.
     *
     * @param params Supplies the bone array and the space-object parent read by the bone transform and the lifetime modifiers.
     */
    UpdateSyncronous(updateContext, params = new EveChildUpdateParams())
    {
        for (const generator of this.placementGenerators)
        {
            generator.UpdateSyncronous(updateContext, params, this);
            if (generator.IsRequestingRegeneration())
            {
                this.RestartDistribution();
                return;
            }
        }

        const deltaTime = updateContext.GetDeltaT() * this.playtimeMultiplier;
        this._playTime += deltaTime;
        this._updatePlacementTimeouts(deltaTime);
        vec3.set(this._placementDataCenter, 0, 0, 0);

        let index = 0;
        while (index < this.placementData.length)
        {
            const placement = this.placementData[index];
            placement.lifeTime += deltaTime;

            if (this._resetTransformOnUpdate)
            {
                placement.translationFrameDelta.set(placement.additionalTranslation);
                vec3.set(placement.additionalTranslation, 0, 0, 0);
                placement.additionalRotation.set([ 0, 0, 0, 1 ]);
                vec3.set(placement.additionalScale, 1, 1, 1);
            }

            this._applyBoneTransform(placement, params);

            let entityKilled = false;
            for (const modifier of this.lifetimeModifiers)
            {
                const event = modifier.ProcessDistributionModifier(placement, deltaTime, params);
                if (event !== DistributionEntityLifeTimeEvent.DO_NOTHING)
                {
                    this._handleDistributionEntityLifetimeEvent(index, event);
                    entityKilled = true;
                    break;
                }
            }

            if (entityKilled)
            {
                continue;
            }

            if (this._resetTransformOnUpdate)
            {
                for (let axis = 0; axis < 3; axis++)
                {
                    placement.translationFrameDelta[axis] -= placement.additionalTranslation[axis];
                }
            }

            for (let axis = 0; axis < 3; axis++)
            {
                this._placementDataCenter[axis] += placement.initialTranslation[axis] + placement.additionalTranslation[axis];
            }
            index++;
        }

        if (this.placementData.length)
        {
            vec3.scale(this._placementDataCenter, this._placementDataCenter, 1 / this.placementData.length);
        }

        for (const spawner of this.spawnTriggers)
        {
            spawner.UpdateSyncronous(updateContext, params, this);
        }
    }

    /**
     * No asynchronous work; the distribution is driven entirely from the
     * synchronous update.
     */
    UpdateAsyncronous(_updateContext, _params)
    {
    }

    /**
     * Spawns entities on randomly chosen free placements, capped by the free
     * placement count, each taking the next unique entity id.
     */
    AddEntities(howMany = 1)
    {
        if (this.freePlacements < 1 || this._initialPlacements.length === 0)
        {
            return;
        }

        const count = Math.min(Math.max(0, Math.trunc(howMany)), this.freePlacements);
        for (let i = 0; i < count; i++)
        {
            const placement = this._getRandomPlacement();
            placement.uniqueID = this.entitiesSpawned++;
            this.placementData.push(placement);
        }
    }

    /**
     * Spawns one entity on the pooled placement with the given unique id, starting that placement's re-trigger timeout and moving it out of the free partition.
     *
     * @returns {number} The index the placement ends up at, or -1 when nothing is free, the id is unknown, or the placement is still timing out.
     */
    TriggerEntityByID(entityID)
    {
        if (this.freePlacements < 1 || this._initialPlacements.length === 0)
        {
            return -1;
        }

        let entityIndex = this._getInitialPlacementIndexByID(entityID);
        if (entityIndex < 0 || this._initialPlacements[entityIndex].timeOutDuration > 0)
        {
            return -1;
        }

        this._initialPlacements[entityIndex].timeOutDuration = this.timeOutOnTriggering;
        if (entityIndex < this.freePlacements)
        {
            this.freePlacements--;
            this._swapInitialPlacements(entityIndex, this.freePlacements);
            entityIndex = this.freePlacements;
        }

        const placement = EveBaseDistributionMethod._clonePlacement(this._initialPlacements[entityIndex].placement);
        placement.initialPlacementID = this._initialPlacements[entityIndex].placement.uniqueID;
        for (const modifier of this.spawnModifiers)
        {
            modifier.ProcessSpawnModifier(placement, this._initialPlacements.length);
        }
        this.placementData.push(placement);
        return entityIndex;
    }

    /** Returns how many pooled placements are currently free to be triggered. */
    GetFreePlacementCount()
    {
        return this.freePlacements;
    }

    /**
     * Returns the unique id of the free placement whose initial translation is
     * nearest the given position, or -1 when none are free.
     */
    GetClosestFreePlacement(position)
    {
        if (this._initialPlacements.length === 0 || this.freePlacements < 1)
        {
            return -1;
        }

        let bestIndex = 0;
        let bestDistance = vec3.squaredDistance(position, this._initialPlacements[0].placement.initialTranslation);
        for (let i = 1; i < this.freePlacements; i++)
        {
            const distance = vec3.squaredDistance(position, this._initialPlacements[i].placement.initialTranslation);
            if (distance < bestDistance)
            {
                bestDistance = distance;
                bestIndex = i;
            }
        }
        return this._initialPlacements[bestIndex].placement.uniqueID;
    }

    /**
     * Returns the pooled placement carrying this unique id, or null when the id is
     * unknown; this is the pool entry itself, not a copy.
     */
    GetInitialPlacementData(uniqueID)
    {
        const index = this._getInitialPlacementIndexByID(uniqueID);
        return index >= 0 && index < this._initialPlacements.length
            ? this._initialPlacements[index].placement
            : null;
    }

    /**
     * Forwards a named controller value to every spawner so controller-driven
     * triggers can react to it.
     */
    SetControllerVariable(name, value)
    {
        for (const spawner of this.spawnTriggers)
        {
            spawner.SetControllerVariable(name, value);
        }
    }

    /**
     * Recomputes whether any lifetime modifier affects the transform, which is
     * what enables the per-frame reset of the additional translation, rotation and
     * scale.
     */
    _refreshDynamicMovement()
    {
        this._resetTransformOnUpdate = false;
        for (const modifier of this.lifetimeModifiers)
        {
            this._resetTransformOnUpdate ||= modifier.AffectsTransform();
        }
    }

    /**
     * Maps a placement unique id to its current index in the pool, or -1 when the
     * id is unknown.
     */
    _getInitialPlacementIndexByID(entityID)
    {
        return this._uniqueIDIndices.get(entityID) ?? -1;
    }

    /**
     * Swaps two pool entries and updates the id-to-index map; this is how
     * placements move between the free and in-use partitions of the pool.
     */
    _swapInitialPlacements(indexA, indexB)
    {
        if (indexA === indexB)
        {
            return;
        }

        const a = this._initialPlacements[indexA];
        const b = this._initialPlacements[indexB];
        this._initialPlacements[indexA] = b;
        this._initialPlacements[indexB] = a;
        this._uniqueIDIndices.set(a.placement.uniqueID, indexB);
        this._uniqueIDIndices.set(b.placement.uniqueID, indexA);
    }

    /**
     * Takes the identified placement out of the free partition, clones it, starts
     * its re-trigger timeout and runs the spawn modifiers plus a zero-delta
     * lifetime modifier pass over the clone; returns null when that placement is
     * not free.
     */
    _getPlacement(entityID)
    {
        if (this.freePlacements < 1 || this._initialPlacements.length === 0)
        {
            return null;
        }

        const selectedIndex = this._getInitialPlacementIndexByID(entityID);
        if (selectedIndex < 0 || selectedIndex >= this.freePlacements)
        {
            return null;
        }

        const initial = this._initialPlacements[selectedIndex];
        initial.timeOutDuration = this.timeOutOnTriggering;
        const placement = EveBaseDistributionMethod._clonePlacement(initial.placement);
        placement.initialPlacementID = initial.placement.uniqueID;
        this.freePlacements--;
        this._swapInitialPlacements(selectedIndex, this.freePlacements);

        for (const modifier of this.spawnModifiers)
        {
            modifier.ProcessSpawnModifier(placement, this._initialPlacements.length);
        }

        const params = new EveChildUpdateParams();
        for (const modifier of this.lifetimeModifiers)
        {
            modifier.ProcessDistributionModifier(placement, 0, params);
        }
        return placement;
    }

    /** Takes a uniformly chosen free placement out of the pool. */
    _getRandomPlacement()
    {
        const selectedIndex = Math.floor(Math.random() * this.freePlacements);
        return this._getPlacement(this._initialPlacements[selectedIndex].placement.uniqueID);
    }

    /**
     * Counts the re-trigger timeout of each used placement down by the frame delta
     * and returns expired ones to the free partition; does nothing when the
     * placements are not allowed to re-trigger.
     */
    _updatePlacementTimeouts(deltaTime)
    {
        if (!this.locationsCanReTrigger || this._initialPlacements.length === 0 || this.freePlacements >= this._initialPlacements.length)
        {
            return;
        }

        let index = this._initialPlacements.length - 1;
        while (index >= this.freePlacements)
        {
            const initial = this._initialPlacements[index];
            if (initial.timeOutDuration > 0)
            {
                initial.timeOutDuration -= deltaTime;
                index--;
            }
            else
            {
                this._swapInitialPlacements(index, this.freePlacements);
                this.freePlacements++;
            }
        }
    }

    /**
     * Rebakes a placement's authored transform against its bone and decomposes the
     * result back into the placement's initial translation, rotation and scale;
     * skipped when the bone index falls outside the supplied bone array.
     */
    _applyBoneTransform(placement, params)
    {
        if (placement.boneIndex < 0 || placement.boneIndex >= params.boneCount)
        {
            return;
        }

        const boneMatrix = mat4.fromJointMatIndex(mat4.create(), params.bones, placement.boneIndex);
        const placementMatrix = this._getInitialPlacementMatrix(placement);
        // Carbon (row-vector): m = m * boneMatrix - placement first, bone last.
        mat4.multiply(placementMatrix, boneMatrix, placementMatrix);
        mat4.decompose(placementMatrix, placement.initialRotation, placement.initialTranslation, placement.initialScale);
    }

    /**
     * Rebuilds the matrix of the pooled placement a live entity came from, with
     * the spawn modifiers reapplied, returning identity when that origin placement
     * no longer exists.
     */
    _getInitialPlacementMatrix(placement)
    {
        const originIndex = this._getInitialPlacementIndexByID(placement.initialPlacementID);
        if (originIndex < 0)
        {
            return mat4.create();
        }

        const initial = EveBaseDistributionMethod._clonePlacement(this._initialPlacements[originIndex].placement);
        for (const modifier of this.spawnModifiers)
        {
            modifier.ProcessSpawnModifier(initial, this._initialPlacements.length);
        }
        return mat4.fromRotationTranslationScale(mat4.create(), initial.initialRotation, initial.initialTranslation, initial.initialScale);
    }

    /**
     * Applies a lifetime modifier's event to the indexed entity: removing it by
     * swapping the last entity into its slot, or replacing it with a fresh
     * placement drawn from the distribution, from its initial position, or from
     * its current position.
     */
    _handleDistributionEntityLifetimeEvent(index, event)
    {
        if (event === DistributionEntityLifeTimeEvent.KILL_ENTITY)
        {
            const last = this.placementData.length - 1;
            if (index !== last)
            {
                this.placementData[index] = this.placementData[last];
            }
            this.placementData.pop();
            return;
        }

        let replacement;
        const current = this.placementData[index];
        switch (event)
        {
            case DistributionEntityLifeTimeEvent.KILL_AND_SPAWN_NEW_FROM_DISTRIBUTION:
                replacement = this._getRandomPlacement();
                break;

            case DistributionEntityLifeTimeEvent.KILL_AND_SPAWN_NEW_FROM_INITIAL_POSITION:
                replacement = EveBaseDistributionMethod._clonePlacement(current);
                replacement.lifeTime = 0;
                break;

            case DistributionEntityLifeTimeEvent.KILL_AND_SPAWN_NEW_FROM_CURRENT_POSITION:
                replacement = EveBaseDistributionMethod._clonePlacement(current);
                for (let axis = 0; axis < 3; axis++)
                {
                    replacement.initialTranslation[axis] += replacement.additionalTranslation[axis];
                    replacement.initialScale[axis] += replacement.additionalScale[axis];
                }
                for (let axis = 0; axis < 4; axis++)
                {
                    replacement.initialRotation[axis] += replacement.additionalRotation[axis];
                }
                replacement.lifeTime = 0;
                break;

            default:
                return;
        }

        replacement.uniqueID = this.entitiesSpawned++;
        this.placementData[index] = replacement;
    }

    /**
     * Deep-copies a placement record so that a spawned entity never mutates the
     * pooled entry it came from.
     */
    static _clonePlacement(source)
    {
        const placement = new PlacementDataWithIdentifier();
        placement.initialTranslation.set(source.initialTranslation);
        placement.initialRotation.set(source.initialRotation);
        placement.initialScale.set(source.initialScale);
        placement.additionalTranslation.set(source.additionalTranslation);
        placement.translationFrameDelta.set(source.translationFrameDelta);
        placement.additionalRotation.set(source.additionalRotation);
        placement.additionalScale.set(source.additionalScale);
        placement.boneIndex = source.boneIndex;
        placement.lifeTime = source.lifeTime;
        placement.uniqueID = source.uniqueID;
        placement.initialPlacementID = source.initialPlacementID;
        return placement;
    }

}
