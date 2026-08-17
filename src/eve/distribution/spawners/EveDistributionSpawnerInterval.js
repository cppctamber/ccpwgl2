// Ported from CarbonEngine (MIT, (c) 2026 CCP Games) - https://github.com/carbonengine/trinity
//   trinity/trinity/Eve/SpaceObject/Utils/EveDistributionMethods/DistributionSpawners/EveDistributionSpawnerInterval.h
import { meta } from "utils";


@meta.type("EveDistributionSpawnerInterval")
@meta.ccp.define("EveDistributionSpawnerInterval")
export class EveDistributionSpawnerInterval extends meta.Model
{

    _localTimer = 0;

    _numTriggered = 0;

    /** m_delayBetweenRepeats (float) [READWRITE, PERSIST] */
    @meta.float
    delayBetweenRepeats = 1;

    /** m_numberOfTriggers (uint32_t) [READWRITE, PERSIST] */
    @meta.uint
    numberOfRepeats = 0;

    /** m_useRandomStartOffset (bool) [READWRITE, PERSIST] */
    @meta.boolean
    useRandomStartOffset = true;

    /** m_maxRandomizedIntervalDelta (float) [READWRITE, PERSIST] */
    @meta.float
    maxRandomizedIntervalDelta = 0;

    /** m_delayBeforeInitialSpawn (float) [READWRITE, PERSIST] */
    @meta.float
    delayBeforeInitialSpawn = 0;

    /** Restarts the interval timer; the placement pool is not used by this spawner. */
    Reset(_placements)
    {
        this.Restart();
    }

    /**
     * Rearms the interval and clears the repeat count, optionally starting at a
     * random point inside one interval and backing the timer off by the initial
     * spawn delay.
     */
    Restart()
    {
        this._localTimer = this.useRandomStartOffset ? Math.random() * this.delayBetweenRepeats : 0;
        this._localTimer -= this.delayBeforeInitialSpawn;
        this._numTriggered = 0;
    }

    /**
     * Spawns one entity each time the timer passes the repeat delay, up to
     * numberOfRepeats (unlimited when it is zero), reseeding the timer with a
     * randomized interval delta.
     */
    UpdateSyncronous(updateContext, _params, owner)
    {
        if (this.numberOfRepeats !== 0 && this._numTriggered >= this.numberOfRepeats)
        {
            return;
        }

        this._localTimer += updateContext.GetDeltaT();
        if (this._localTimer > this.delayBetweenRepeats)
        {
            owner.AddEntities(1);
            this._numTriggered++;
            this._localTimer = this.maxRandomizedIntervalDelta
                - 2 * Math.random() * this.maxRandomizedIntervalDelta;
        }
    }

    /** Ignores controller variables; the interval is purely time-driven. */
    SetControllerVariable(_name, _value)
    {
    }

}
