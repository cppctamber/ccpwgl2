// Ported from CarbonEngine (MIT, (c) 2026 CCP Games) - https://github.com/carbonengine/trinity
//   trinity/trinity/Eve/SpaceObject/Utils/EveDistributionMethods/DistributionSpawnModifiers/EveDistributionSpawnModifierLifeTimeOffset.h
import { meta } from "utils";
import { createMinStdRandom, getDistributionSeed } from "../CjsDistributionRandom.js";


@meta.type("EveDistributionSpawnModifierLifeTimeOffset")
@meta.ccp.define("EveDistributionSpawnModifierLifeTimeOffset")
export class EveDistributionSpawnModifierLifeTimeOffset extends meta.Model
{

    _timeSeed = Date.now() >>> 0;

    _currentCascadingOffset = 0;

    /** m_minOffset (float) [READWRITE, PERSIST] */
    @meta.float
    minOffset = 0;

    /** m_maxOffset (float) [READWRITE, PERSIST] */
    @meta.float
    maxOffset = 0;

    /** m_consistentRandom (bool) [READWRITE, PERSIST] */
    @meta.boolean
    consistentRandom = false;

    /** m_cascadingLifetimeOffset (float) [READWRITE, PERSIST] */
    @meta.float
    cascadingLifetimeOffset = 0;

    /** m_normalizeOffsets (bool) [READWRITE, PERSIST] */
    @meta.boolean
    normalizeOffsets = false;

    /**
     * Reseeds the random stream from the wall clock, so offsets differ between
     * runs unless consistentRandom pins them to the placement id.
     */
    Initialize()
    {
        this._timeSeed = Date.now() >>> 0;
        return true;
    }

    /**
     * Staggers a spawning placement's starting lifetime: with normalizeOffsets it
     * replaces the lifetime with an evenly cascading step through the min..max
     * range across the pool, otherwise it adds a random offset in that range plus
     * a per-placement cascade.
     */
    ProcessSpawnModifier(placement, numPlacements)
    {
        if (this.normalizeOffsets)
        {
            const range = this.maxOffset - this.minOffset;
            const perInstanceOffset = range / numPlacements;
            this._currentCascadingOffset += perInstanceOffset;
            placement.lifeTime = this.minOffset + this._currentCascadingOffset % range;
            return;
        }

        const seed = getDistributionSeed(placement.uniqueID, this._timeSeed, this.consistentRandom);
        const random = createMinStdRandom(seed);
        const randomOffset = this.minOffset + (this.maxOffset - this.minOffset) * random()
            + this.cascadingLifetimeOffset * placement.initialPlacementID;
        this._currentCascadingOffset += this.cascadingLifetimeOffset;
        placement.lifeTime += randomOffset;
    }

}
