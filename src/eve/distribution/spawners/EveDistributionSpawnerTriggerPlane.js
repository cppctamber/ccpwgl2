// Ported from CarbonEngine (MIT, (c) 2026 CCP Games) - https://github.com/carbonengine/trinity
//   trinity/trinity/Eve/SpaceObject/Utils/EveDistributionMethods/DistributionSpawners/EveDistributionSpawnerTriggerPlane.h
import { meta } from "utils";
import { vec3, quat } from "math";


@meta.type("EveDistributionSpawnerTriggerPlane")
@meta.ccp.define("EveDistributionSpawnerTriggerPlane")
export class EveDistributionSpawnerTriggerPlane extends meta.Model
{

    _distSortedIndexes = [];

    _currentPlayTime = 0;

    _currentTrigger = 0;

    /** m_triggerChance (float) [READWRITE, PERSIST] */
    @meta.float
    triggerChance = 1;

    /** m_planeRotation (Quaternion) [READWRITE, PERSIST] */
    @meta.quaternion
    planeRotation = quat.create();

    /** m_startSequenceAtFirstTrigger (bool) [READWRITE, PERSIST] */
    @meta.boolean
    startSequenceAtFirstTrigger = true;

    /** m_playDuration (float) [READWRITE, PERSIST] */
    @meta.float
    playDuration = 1;

    /** m_delayBeforeActivation (float) [READWRITE, PERSIST] */
    @meta.float
    delayBeforeActivation = 0;

    /** m_reversePlaneAnimation (bool) [READWRITE, PERSIST] */
    @meta.boolean
    reversePlaneAnimation = false;

    /**
     * Sorts the pooled placements by their distance along the plane normal and
     * normalizes those distances into the 0..1 sweep order the update walks, then
     * restarts.
     */
    Reset(placements)
    {
        if (placements.length === 0)
        {
            return;
        }

        const normal = vec3.transformQuat(vec3.create(), vec3.fromValues(0, 1, 0), this.planeRotation);
        this._distSortedIndexes.length = 0;
        for (const placement of placements)
        {
            const distance = vec3.dot(normal, placement.placement.initialTranslation);
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
     * Rewinds the sweep to its first placement, or its last when the animation is
     * reversed, and clears the play time.
     */
    Restart()
    {
        this._currentTrigger = this.reversePlaneAnimation ? this._distSortedIndexes.length - 1 : 0;
        this._currentPlayTime = 0;
    }

    /**
     * Advances the play time and triggers every placement the sweeping plane has
     * passed, each subject to triggerChance, ending once the sorted order is
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
        if (!this.reversePlaneAnimation)
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

    /** Ignores controller variables; the sweep is purely time-driven. */
    SetControllerVariable(_name, _value)
    {
    }

}
