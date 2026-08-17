// Ported from CarbonEngine (MIT, (c) 2026 CCP Games) - https://github.com/carbonengine/trinity
//   trinity/trinity/Eve/SpaceObject/Utils/EveDistributionMethods/DistributionSpawners/EveDistributionSpawnerBurst.h
import { meta } from "utils";


@meta.type("EveDistributionSpawnerBurst")
@meta.ccp.define("EveDistributionSpawnerBurst")
export class EveDistributionSpawnerBurst extends meta.Model
{

    _localTimer = 0;

    /** m_completeness (float) [READWRITE, PERSIST] */
    @meta.float
    completeness = 1;

    /** m_additionalTriggersPerBurst (uint32_t) [READWRITE, PERSIST] */
    @meta.uint
    additionalTriggersPerBurst = 0;

    /** m_delayBeforeInitialBurst (float) [READWRITE, PERSIST] */
    @meta.float
    delayBeforeInitialBurst = 0;

    /**
     * Restarts the burst timer; the placement pool is not sorted or otherwise used
     * by this spawner.
     */
    Reset(_placements)
    {
        this.Restart();
    }

    /**
     * Rearms the spawner by clearing the timer, allowing the one-shot burst to
     * fire again.
     */
    Restart()
    {
        this._localTimer = 0;
    }

    /**
     * Waits out the initial delay, then spawns a `completeness` fraction of the
     * currently free placements plus the extra per-burst triggers in one go, and
     * disarms itself until restarted.
     */
    UpdateSyncronous(updateContext, _params, owner)
    {
        if (this._localTimer === -1)
        {
            return;
        }

        if (this._localTimer < this.delayBeforeInitialBurst)
        {
            this._localTimer += updateContext.GetDeltaT();
            return;
        }

        const availableTriggers = owner.GetFreePlacementCount();
        let numTriggers = Math.trunc(this.completeness * availableTriggers);
        numTriggers += this.additionalTriggersPerBurst;
        owner.AddEntities(Math.min(numTriggers, availableTriggers));
        this._localTimer = -1;
    }

    /** Ignores controller variables; the burst is purely time-driven. */
    SetControllerVariable(_name, _value)
    {
    }

}
