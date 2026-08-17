// Ported from CarbonEngine (MIT, (c) 2026 CCP Games) - https://github.com/carbonengine/trinity
//   trinity/trinity/Eve/SpaceObject/Utils/EveDistributionMethods/DistributionSpawners/EveDistributionSpawnerTriggerSphere.h
import { meta } from "utils";
import { vec3 } from "math";


@meta.type("EveDistributionSpawnerTriggerSphere")
@meta.ccp.define("EveDistributionSpawnerTriggerSphere")
export class EveDistributionSpawnerTriggerSphere extends meta.Model
{

    _distSortedIndexes = [];

    _currentPlayTime = 0;

    _currentTrigger = 0;

    /** m_triggerChance (float) [READWRITE, PERSIST] */
    @meta.float
    triggerChance = 1;

    /** m_startSequenceAtFirstTrigger (bool) [READWRITE, PERSIST] */
    @meta.boolean
    startSequenceAtFirstTrigger = true;

    /** m_sphereOffset (Vector3) [READWRITE, PERSIST] */
    @meta.vector3
    sphereOffset = vec3.create();

    /** m_playDuration (float) [READWRITE, PERSIST] */
    @meta.float
    playDuration = 1;

    /** m_delayBeforeActivation (float) [READWRITE, PERSIST] */
    @meta.float
    delayBeforeActivation = 0;

    /** m_reverseSphereAnimation (bool) [READWRITE, PERSIST] */
    @meta.boolean
    reverseSphereAnimation = false;

    /**
     * Sorts the pooled placements by their distance from the sphere offset and
     * normalizes those distances into the 0..1 expansion order the update walks,
     * then restarts.
     */
    Reset(placements)
    {
        if (placements.length === 0)
        {
            return;
        }

        this._distSortedIndexes.length = 0;
        for (const placement of placements)
        {
            const distance = vec3.distance(placement.placement.initialTranslation, this.sphereOffset);
            this._distSortedIndexes.push([ distance, placement.placement.uniqueID ]);
        }
        this._distSortedIndexes.sort((a, b) => a[0] - b[0]);

        const minimumDistance = this.startSequenceAtFirstTrigger ? this._distSortedIndexes[0][0] : 0;
        const maximumDistance = Math.max(1, this._distSortedIndexes.at(-1)[0] - minimumDistance);
        for (const trigger of this._distSortedIndexes)
        {
            trigger[0] = (trigger[0] - minimumDistance) / maximumDistance;
        }
        this.Restart();
    }

    /**
     * Rewinds the expansion to its first placement, or its last when the animation
     * is reversed, and clears the play time.
     */
    Restart()
    {
        this._currentTrigger = this.reverseSphereAnimation ? this._distSortedIndexes.length - 1 : 0;
        this._currentPlayTime = 0;
    }

    /**
     * Advances the play time and triggers every placement the expanding sphere has
     * reached, each subject to triggerChance, ending once the sorted order is
     * exhausted or the play duration elapses.
     */
    UpdateSyncronous(updateContext, _params, owner)
    {
        if (this._distSortedIndexes.length === 0
            || this._currentPlayTime >= this.playDuration + this.delayBeforeActivation)
        {
            return;
        }

        this._currentPlayTime += updateContext.GetDeltaT();
        if (this._currentPlayTime < this.delayBeforeActivation)
        {
            return;
        }

        const normalizedPlayTime = (this._currentPlayTime - this.delayBeforeActivation)
            / Math.max(0.01, this.playDuration);
        if (!this.reverseSphereAnimation)
        {
            while (normalizedPlayTime > this._distSortedIndexes[this._currentTrigger][0])
            {
                if (Math.random() < this.triggerChance)
                {
                    owner.TriggerEntityByID(this._distSortedIndexes[this._currentTrigger][1]);
                }
                this._currentTrigger++;
                if (this._currentTrigger >= this._distSortedIndexes.length)
                {
                    this._currentPlayTime = this.playDuration + this.delayBeforeActivation;
                    break;
                }
            }
        }
        else
        {
            while (1 - normalizedPlayTime < this._distSortedIndexes[this._currentTrigger][0])
            {
                if (Math.random() < this.triggerChance)
                {
                    owner.TriggerEntityByID(this._distSortedIndexes[this._currentTrigger][1]);
                }
                if (this._currentTrigger === 0)
                {
                    this._currentPlayTime = this.playDuration + this.delayBeforeActivation;
                    break;
                }
                this._currentTrigger--;
            }
        }
    }

    /** Ignores controller variables; the expansion is purely time-driven. */
    SetControllerVariable(_name, _value)
    {
    }

}
