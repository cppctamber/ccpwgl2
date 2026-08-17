// Ported from CarbonEngine (MIT, (c) 2026 CCP Games) - https://github.com/carbonengine/trinity
//   trinity/trinity/Eve/SpaceObject/Utils/EveDistributionMethods/DistributionSpawners/EveDistributionSpawnerTriggerSnake.h
import { meta } from "utils";
import { vec3 } from "math";


@meta.type("EveDistributionSpawnerTriggerSnake")
@meta.ccp.define("EveDistributionSpawnerTriggerSnake")
export class EveDistributionSpawnerTriggerSnake extends meta.Model
{

    _activeTargetUniqueID = 0;

    _targetPoint = vec3.create();

    _lastTarget = vec3.create();

    _currentTravelTime = 0;

    _travelDurationToNextPoint = 1;

    /** m_minTimeBetweenTriggers (float) [READWRITE, PERSIST] */
    @meta.float
    minBaseTimeBetweenTriggers = 1;

    /** m_maxTimeBetweenTriggers (float) [READWRITE, PERSIST] */
    @meta.float
    maxBaseTimeBetweenTriggers = 1;

    /** m_travelProgress (float) [READ] */
    @meta.float
    travelProgress = 1;

    /** m_numDestinationsReached (int32_t) [READ] */
    @meta.int32
    destinationsReached = 0;

    /** m_totalDestinations (int32_t) [READWRITE, PERSIST] */
    @meta.int32
    totalDestinations = 5;

    /** m_distanceToTravelTimeMultiplier (float) [READWRITE, PERSIST] */
    @meta.float
    distanceToTravelTimeMultiplier = 0;

    /**
     * Picks a random pooled placement as the first target of the walk and
     * restarts.
     */
    Reset(placements)
    {
        if (placements.length === 0)
        {
            return;
        }

        const index = Math.floor(Math.random() * placements.length);
        const placement = placements[index].placement;
        vec3.copy(this._targetPoint, placement.initialTranslation);
        vec3.copy(this._lastTarget, this._targetPoint);
        this._activeTargetUniqueID = placement.uniqueID;
        this.Restart();
    }

    /**
     * Clears the travel timers and the destination count, leaving a zero travel
     * duration so the next update triggers the current target immediately.
     */
    Restart()
    {
        this.destinationsReached = -1;
        this._currentTravelTime = 0;
        this._travelDurationToNextPoint = 0;
    }

    /**
     * Triggers the current target once its travel time is up, then hops to the
     * free placement nearest a point extrapolated past the last target, charging
     * extra travel time for the distance covered; stops after totalDestinations,
     * which -1 makes unlimited.
     */
    UpdateSyncronous(updateContext, _params, owner)
    {
        if (this.destinationsReached >= this.totalDestinations && this.totalDestinations !== -1)
        {
            return;
        }

        this._currentTravelTime += updateContext.GetDeltaT();
        this.travelProgress = this._travelDurationToNextPoint > 0
            ? this._currentTravelTime / this._travelDurationToNextPoint
            : 1;

        if (this.travelProgress < 1)
        {
            return;
        }

        owner.TriggerEntityByID(this._activeTargetUniqueID);
        this._currentTravelTime = 0;
        this.travelProgress = 0;
        this.destinationsReached++;
        this._travelDurationToNextPoint = this.minBaseTimeBetweenTriggers
            + (this.maxBaseTimeBetweenTriggers - this.minBaseTimeBetweenTriggers) * Math.random();

        const searchPoint = vec3.lerp(vec3.create(), this._lastTarget, this._targetPoint, 1.3);
        const closestPlacement = owner.GetClosestFreePlacement(searchPoint);
        if (closestPlacement === -1)
        {
            return;
        }

        const placement = owner.GetInitialPlacementData(closestPlacement);
        if (placement)
        {
            vec3.copy(this._lastTarget, this._targetPoint);
            this._activeTargetUniqueID = placement.uniqueID;
            vec3.copy(this._targetPoint, placement.initialTranslation);
            this._travelDurationToNextPoint += vec3.distance(this._targetPoint, this._lastTarget)
                * this.distanceToTravelTimeMultiplier / 100;
        }
    }

    /** Ignores controller variables; the walk is purely time-driven. */
    SetControllerVariable(_name, _value)
    {
    }

}
