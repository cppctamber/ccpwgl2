import { meta } from "utils";
import { vec3, mat4 } from "math";


class EvePerMuzzleData
{

    constantDelay = 0;
    currentStartDelay = 0;
    elapsedTime = 0;
    muzzlePositionBoneID = 0xffffffff;
    muzzleTransform = mat4.create();
    readyToStart = false;
    started = false;

}


@meta.define("EveTurretFiringFX", true)
@meta.stage(2)
export class EveTurretFiringFX extends meta.Model
{

    @meta.string
    name = "";

    @meta.string
    boneName = "Pos_Fire";

    @meta.boolean
    display = true;

    @meta.notImplemented
    @meta.struct("TriObserverLocal")
    destinationObserver = null;

    @meta.float
    firingDelay1 = 0;

    @meta.float
    firingDelay2 = 0;

    @meta.float
    firingDelay3 = 0;

    @meta.float
    firingDelay4 = 0;

    @meta.float
    firingDelay5 = 0;

    @meta.float
    firingDelay6 = 0;

    @meta.float
    firingDelay7 = 0;

    @meta.float
    firingDelay8 = 0;

    @meta.float
    firingDelay9 = 0;

    @meta.float
    firingDelay10 = 0;

    @meta.float
    firingDelay11 = 0;

    @meta.float
    firingDelay12 = 0;

    @meta.float
    firingDurationOverride = -1;

    @meta.float
    firingPeakTime = 0;

    @meta.boolean
    isLoopFiring = false;

    @meta.float
    maxRadius = 3000;

    @meta.float
    maxScale = 10;

    @meta.float
    minRadius = 30;

    @meta.float
    minScale = 1;

    @meta.boolean
    scaleEffectTarget = false;

    @meta.notImplemented
    @meta.struct("TriObserverLocal")
    sourceObserver = null;

    @meta.struct("Tw2CurveSet")
    startCurveSet = null;

    @meta.struct("Tw2CurveSet")
    stopCurveSet = null;

    @meta.list([ "EveStretch", "EveStretch2" ])
    stretch = [];

    @meta.boolean
    useMuzzleTransform = false;


    _endPosition = vec3.create();
    _firingDuration = 1000;
    _isFiring = false;
    _perMuzzleData = [];
    _displayDestObject = true;
    _impactConfiguration = 0;
    _isLoopFiringForced = false;


    /**
     * Initializes the turret firing fx
     */
    Initialize()
    {
        if (this.firingDurationOverride >= 0)
        {
            this._firingDuration = this.firingDurationOverride;
        }
        else
        {
            const duration = this.GetCurveDuration();
            if (duration > 0) this._firingDuration = duration;
        }
        this._EnsurePerMuzzleData(true);
        return true;
    }

    /**
     * Ensures runtime data exists for every authored muzzle.
     * @param {Boolean} [reset=false]
     * @private
     */
    _EnsurePerMuzzleData(reset = false)
    {
        if (reset) this._perMuzzleData.length = 0;
        while (this._perMuzzleData.length < this.stretch.length)
        {
            this._perMuzzleData.push(new EvePerMuzzleData());
        }
        this._perMuzzleData.length = this.stretch.length;

        const delays = [
            this.firingDelay1, this.firingDelay2, this.firingDelay3, this.firingDelay4,
            this.firingDelay5, this.firingDelay6, this.firingDelay7, this.firingDelay8,
            this.firingDelay9, this.firingDelay10, this.firingDelay11, this.firingDelay12
        ];
        for (let i = 0; i < this._perMuzzleData.length; i++)
        {
            this._perMuzzleData[i].constantDelay = delays[i] || 0;
        }
    }

    /**
     * Gets the total curve duration
     * @returns {number}
     */
    GetCurveDuration()
    {
        let maxDuration = 0;
        for (let i = 0; i < this.stretch.length; ++i)
        {
            const stretch = this.stretch[i];
            if (typeof stretch.GetCurveDuration === "function")
            {
                maxDuration = Math.max(maxDuration, stretch.GetCurveDuration());
                continue;
            }

            const curveSets = stretch.curveSets || [];
            for (let j = 0; j < curveSets.length; ++j)
            {
                maxDuration = Math.max(maxDuration, curveSets[j].GetMaxCurveDuration());
            }
        }
        return maxDuration;
    }

    /**
     * Gets a count of stretch effects
     * @returns {Number}
     */
    GetPerMuzzleEffectCount()
    {
        return this.stretch.length;
    }

    /**
     * Sets the firing fx's end position
     * @param {vec3} v
     */
    SetEndPosition(v)
    {
        this._endPosition[0] = v[0];
        this._endPosition[1] = v[1];
        this._endPosition[2] = v[2];
    }

    /**
     * Gets the effective firing duration
     * @returns {Number}
     */
    GetFiringDuration()
    {
        return this.firingDurationOverride >= 0 ? this.firingDurationOverride : this._firingDuration;
    }

    /**
     * Gets the firing impact peak time
     * @returns {Number}
     */
    GetFiringPeakTime()
    {
        return this.firingPeakTime;
    }

    /**
     * Gets the authored firing bone prefix.
     * @returns {String}
     */
    GetFiringBoneName()
    {
        return this.boneName;
    }

    /**
     * Gets the average world position of all started muzzles.
     * @param {vec3} out
     * @returns {Boolean}
     */
    GetStartPosition(out = vec3.create())
    {
        if (!this._isFiring) return false;
        this._EnsurePerMuzzleData();

        let count = 0;
        const x = out[0], y = out[1], z = out[2];
        vec3.set(out, 0, 0, 0);
        for (let i = 0; i < this._perMuzzleData.length; i++)
        {
            const data = this._perMuzzleData[i];
            if (!data.started) continue;
            out[0] += data.muzzleTransform[12];
            out[1] += data.muzzleTransform[13];
            out[2] += data.muzzleTransform[14];
            count++;
        }

        if (!count)
        {
            vec3.set(out, x, y, z);
            return false;
        }

        vec3.scale(out, out, 1 / count);
        return true;
    }

    /**
     * Scales destination effects from the live target radius
     * @param {Number} radius
     */
    SetScaleByRadius(radius)
    {
        if (!this.scaleEffectTarget) return;
        const span = this.maxRadius - this.minRadius;
        const amount = span ? (Number(radius) - this.minRadius) / span : 0;
        const scale = Math.max(this.minScale, Math.min(this.maxScale, this.minScale + amount * (this.maxScale - this.minScale)));
        for (let i = 0; i < this.stretch.length; i++)
        {
            this.stretch[i].SetDestObjectScale?.(scale);
        }
    }

    SetDisplayDestObject(display)
    {
        this._displayDestObject = !!display;
    }

    GetDisplayDestObject()
    {
        return this._displayDestObject;
    }

    SetImpactConfiguration(configuration)
    {
        configuration = Number(configuration) | 0;
        if (configuration !== this._impactConfiguration)
        {
            const observer = this.destinationObserver?.GetObserver?.();
            const value = configuration === EveTurretFiringFX.ImpactConfiguration.IMPACT_ARMOR
                ? "Armor"
                : configuration === EveTurretFiringFX.ImpactConfiguration.IMPACT_HULL ? "Hull" : "Shield";
            observer?.SetSwitch?.("Impact_On", value);
        }
        this._impactConfiguration = configuration;
    }

    GetImpactConfiguration()
    {
        return this._impactConfiguration;
    }

    /**
     * Sets muzzle bone id
     * @param {number} index
     * @param {number} boneID
     */
    SetMuzzleBoneID(index, boneID)
    {
        this._EnsurePerMuzzleData();
        if (index >= 0 && index < this._perMuzzleData.length)
        {
            this._perMuzzleData[index].muzzlePositionBoneID = Number(boneID) >>> 0;
        }
    }

    /**
     * Sets a muzzle's world transform.
     * @param {number} index
     * @param {mat4} transform
     */
    SetMuzzleTransform(index, transform)
    {
        this._EnsurePerMuzzleData();
        if (index >= 0 && index < this._perMuzzleData.length)
        {
            mat4.copy(this._perMuzzleData[index].muzzleTransform, transform);
        }
    }

    /**
     * Gets a muzzle's transform
     * @param {number} index
     * @returns {mat4}
     */
    GetMuzzleTransform(index)
    {
        this._EnsurePerMuzzleData();
        return this._perMuzzleData[index].muzzleTransform;
    }

    /**
     * Restarts the move objects used by looping firing effects.
     */
    PrepareFiringEffectMoveObjects()
    {
        for (let i = 0; i < this.stretch.length; i++)
        {
            this.stretch[i]?.StartMoving?.();
        }
        this._isFiring = true;
    }

    /**
     * Prepares the firing effect
     * @param {number} delay
     * @param {number} [muzzleID=-1]
     * @param {number} [muzzleCount=-1]
     */
    PrepareFiring(delay, muzzleID = -1, muzzleCount = -1)
    {
        this._EnsurePerMuzzleData();
        for (let i = 0; i < this.stretch.length; ++i)
        {
            if (muzzleID < 0 || (i >= muzzleID && (muzzleCount < 0 || i < muzzleID + muzzleCount)))
            {
                this._perMuzzleData[i].currentStartDelay = delay + this._perMuzzleData[i].constantDelay;
                this._perMuzzleData[i].started = false;
                this._perMuzzleData[i].readyToStart = false;
                this._perMuzzleData[i].elapsedTime = 0;
            }
            else
            {
                this._perMuzzleData[i].currentStartDelay = Number.MAX_VALUE;
                this._perMuzzleData[i].started = false;
                this._perMuzzleData[i].readyToStart = false;
                this._perMuzzleData[i].elapsedTime = 0;
            }
        }
        this._isFiring = true;
    }

    /**
     * Starts a muzzle effect
     * @param {number} muzzleID
     */
    StartMuzzleEffect(muzzleID)
    {
        this._EnsurePerMuzzleData();
        const stretch = this.stretch[muzzleID];
        if (!stretch || !this._perMuzzleData[muzzleID]) return false;
        const delay = this._perMuzzleData[muzzleID].currentStartDelay;

        if (typeof stretch.StartFiring === "function")
        {
            stretch.StartFiring(delay);
        }
        else
        {
            const curveSets = stretch.curveSets || [];
            for (let i = 0; i < curveSets.length; ++i)
            {
                const curveSet = curveSets[i];
                switch (curveSet.name)
                {
                    case "play_start":
                    case "play_loop":
                        curveSet.PlayFrom(-delay);
                        break;

                    case "play_stop":
                        curveSet.Stop();
                        break;
                }
            }
        }

        this.startCurveSet?.PlayFrom?.(-delay);
        this.stopCurveSet?.Stop?.();

        this._perMuzzleData[muzzleID].started = true;
        this._perMuzzleData[muzzleID].readyToStart = false;
        return true;
    }

    /**
     * Stops the firing effect
     */
    StopFiring()
    {
        if (!this._isFiring) return;
        this._EnsurePerMuzzleData();

        for (let j = 0; j < this.stretch.length; ++j)
        {
            const stretch = this.stretch[j];
            if (typeof stretch.StopFiring === "function")
            {
                stretch.StopFiring();
            }
            else
            {
                const curveSets = stretch.curveSets || [];
                for (let i = 0; i < curveSets.length; ++i)
                {
                    const curveSet = curveSets[i];
                    switch (curveSet.name)
                    {
                        case "play_start":
                        case "play_loop":
                            curveSet.Stop();
                            break;

                        case "play_stop":
                            curveSet.Play();
                            break;
                    }
                }
            }
            this._perMuzzleData[j].started = false;
            this._perMuzzleData[j].readyToStart = false;
            this._perMuzzleData[j].currentStartDelay = 0;
            this._perMuzzleData[j].elapsedTime = 0;
        }
        this.startCurveSet?.Stop?.();
        this.stopCurveSet?.Play?.();
        this._isFiring = false;
    }

    /**
     * Checks whether a delayed muzzle is ready to start on the next update.
     * @returns {Boolean}
     */
    ReadyToFire()
    {
        this._EnsurePerMuzzleData();
        for (let i = 0; i < this._perMuzzleData.length; i++)
        {
            const data = this._perMuzzleData[i];
            if ((data.elapsedTime < this._firingDuration || this.isLoopFiring) &&
                !data.started && data.readyToStart)
            {
                return true;
            }
        }
        return false;
    }

    /**
     * Updates view dependant data
     * @param {mat4} parentTransform
     */
    UpdateViewDependentData(parentTransform)
    {
        // Eve Turret handles parentTransforms for muzzles

        for (let i = 0; i < this.stretch.length; ++i)
        {
            this.stretch[i].UpdateViewDependentData(parentTransform);
        }
    }

    /**
     * Updates visibility for active per-muzzle stretch effects.
     * @param {EveUpdateContext} updateContext
     */
    UpdateLod(updateContext)
    {
        if (!this.display || !this._isFiring) return;

        for (let i = 0; i < this.stretch.length; ++i)
        {
            if (this._perMuzzleData[i].started &&
                (this._perMuzzleData[i].elapsedTime <= this._firingDuration || this.isLoopFiring))
            {
                this.stretch[i].UpdateLod(updateContext);
            }
        }
    }

    /** Restores every stretch to authored LOD state. */
    ResetLod()
    {
        for (let i = 0; i < this.stretch.length; ++i)
        {
            this.stretch[i].ResetLod();
        }
    }

    /**
     * Per frame update
     * @param {number} dt - Delta time
     */
    Update(dt)
    {
        this._EnsurePerMuzzleData();
        for (let i = 0; i < this.stretch.length; ++i)
        {
            if (this._perMuzzleData[i].started)
            {
                this._perMuzzleData[i].elapsedTime += dt;
            }

            if (this._perMuzzleData[i].elapsedTime < this._firingDuration || this.isLoopFiring)
            {
                if (this._isFiring)
                {
                    if (!this._perMuzzleData[i].started)
                    {
                        if (this._perMuzzleData[i].readyToStart)
                        {
                            this.StartMuzzleEffect(i);
                            this._perMuzzleData[i].currentStartDelay = 0;
                            this._perMuzzleData[i].elapsedTime = 0;
                        }
                        else
                        {
                            this._perMuzzleData[i].currentStartDelay -= dt;
                        }

                        if (this._perMuzzleData[i].currentStartDelay <= 0)
                        {
                            this._perMuzzleData[i].readyToStart = true;
                        }
                    }
                    if (this._perMuzzleData[i].started)
                    {
                        const stretch = this.stretch[i];
                        if (typeof stretch.SetFiringTransform === "function")
                        {
                            const data = this._perMuzzleData[i];
                            const transform = data.muzzleTransform;
                            const useTransform = this.useMuzzleTransform &&
                                data.muzzlePositionBoneID !== EveTurretFiringFX.INVALID_BONE_INDEX;
                            stretch.SetFiringTransform(useTransform ? transform : transform.subarray(12, 15), this._endPosition);
                            stretch.DisplayEndPoints(true, this._displayDestObject);
                        }
                        else
                        {
                            if (this.useMuzzleTransform)
                            {
                                stretch.SetSourceTransform(this._perMuzzleData[i].muzzleTransform);
                            }
                            else
                            {
                                stretch.SetSourcePositionFromTransform(this._perMuzzleData[i].muzzleTransform);
                            }
                            stretch.SetDestinationPosition(this._endPosition);
                            stretch.SetIsNegZForward(true);
                        }
                    }
                }
            }
            // Only while firing, as UpdateLod and GetBatches already do. A
            // stretch exists to draw the beam and GetBatches refuses to draw
            // one when the set is not firing, so a tick here advances state
            // nothing can show. It also throws: EveStretch3.Update forwards
            // only the delta to its sourceObject, and an EveChild source needs
            // the parent transform - a mining turret reached this every frame
            // and killed the render loop, because the scene update runs before
            // anything draws. The wind-down does not need it either:
            // StopFiring tells each stretch directly before clearing the flag.
            if (this._isFiring) this.stretch[i].Update(dt);
        }

        const curveSet = this._isFiring ? this.startCurveSet : this.stopCurveSet;
        curveSet?.UpdateDelta?.(dt);
    }

    /**
     * Gets the bone identifier assigned to a muzzle.
     * @param {Number} muzzleID
     * @returns {Number}
     */
    GetPerMuzzleBoneID(muzzleID)
    {
        this._EnsurePerMuzzleData();
        return this._perMuzzleData[muzzleID]?.muzzlePositionBoneID ?? EveTurretFiringFX.INVALID_BONE_INDEX;
    }

    /**
     * Checks whether the effect fires continuously.
     * @returns {Boolean}
     */
    IsLooping()
    {
        return this.isLoopFiring;
    }

    /**
     * Marks looping requested by a runtime controller rather than authored by
     * the firing effect. One-shot curve sets need to be fully rearmed between
     * shots; Carbon's looping shortcut only restarts move objects.
     * @param {Boolean} forced
     */
    SetLoopFiringForced(forced)
    {
        this._isLoopFiringForced = !!forced;
    }

    /** @returns {Boolean} */
    IsLoopFiringForced()
    {
        return this._isLoopFiringForced;
    }

    /**
     * Gets render batches
     * @param {number} mode
     * @param {Tw2BatchAccumulator} accumulator
     * @param {Tw2PerObjectData} perObjectData
     * @returns {Boolean} true if batches accumulated
     */
    GetBatches(mode, accumulator, perObjectData)
    {
        if (!this.display || !this._isFiring) return false;
        perObjectData = perObjectData || accumulator.GetCurrentPerObjectData?.();

        let c = accumulator.length;

        for (let i = 0; i < this.stretch.length; ++i)
        {
            if (this._perMuzzleData[i].started && (this._firingDuration >= this._perMuzzleData[i].elapsedTime || this.isLoopFiring))
            {
                this.stretch[i].GetBatches(mode, accumulator, perObjectData);
            }
        }

        return accumulator.length !== c;
    }

    static ImpactConfiguration = Object.freeze({
        IMPACT_INVALID: 0,
        IMPACT_SHIELD: 1,
        IMPACT_ARMOR: 2,
        IMPACT_HULL: 3
    });

    static INVALID_BONE_INDEX = 0xffffffff;

}
