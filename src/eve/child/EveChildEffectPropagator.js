// Source: E:\carbonengine\trinity\trinity\Eve\SpaceObject\Children\EveChildEffectPropagator.cpp
import { meta } from "utils";
import { quat, vec3 } from "math";
import { EveChildContainer } from "./EveChildContainer";
import { EveChildInstanceContainer } from "./EveChildInstanceContainer";


/**
 * Carbon `TriQuaternionDirVector` (`TriMath.cpp:262-269`): stores the NORMALISED
 * direction in the quaternion's x/y/z with w = 0. It is a packed direction, not
 * a rotation, so nothing here is a quaternion composition.
 * @param {quat} out
 * @param {vec3} v
 * @returns {quat} out
 */
function PackDirection(out, v)
{
    const
        length = Math.hypot(v[0], v[1], v[2]),
        scale = length ? 1 / length : 0;

    out[0] = v[0] * scale;
    out[1] = v[1] * scale;
    out[2] = v[2] * scale;
    out[3] = 0;
    return out;
}

/** Carbon's per-locator processed record (`EveChildEffectPropagator.h:66-72`). */
function NewTransformRecord()
{
    return {
        rotation: quat.create(),
        position: vec3.create(),
        scale: vec3.fromValues(1, 1, 1),
        sqrDistToSphereCenter: 0
    };
}

/** Carbon `SortByCircleDist` (`h:74-80`) - ascending squared distance. */
function SortByCircleDist(a, b)
{
    return a.sqrDistToSphereCenter - b.sqrDistToSphereCenter;
}


/**
 * Fires copies of one effect at a set of locators as a trigger sweeps them.
 *
 * **It does not propagate properties to children.** Carbon's header says what it
 * is for (`EveChildEffectPropagator.h:14-17`): artists animate a trigger-sphere
 * radius with a scalar curve and effects fire as the sphere reaches each
 * locator. "Propagation" is how the spawn points are CHOSEN - this node's own
 * locator set, a named set on the parent object, or a random spread.
 * "Triggering" is WHEN each fires - the growing sphere, a fixed interval, or all
 * at once.
 *
 * It holds one `EveChildInstanceContainer` as a spawn TEMPLATE and calls
 * `CreateInstance` on it. Note that the container normally builds its own
 * instances from a locator set on `_reset`; under a propagator it must not, or
 * the rebuild discards every spawn. `SetEffect` and `Initialize` below take care
 * of that.
 *
 * Carbon deliberately REPLACES the container fan-out rather than extending it:
 * `UpdateVisibility`, `GetRenderables` and `SetControllerVariable` forward to the
 * effect only and never call the base (`cpp:370-410`, `:660-666`). Only
 * `UpdateAsyncronous` calls the base (`cpp:367`). That is preserved here.
 *
 * Transcribed from runtime-trinity's complete port, cross-checked against the
 * C++. Not ported, and not missing: the debug renderer, the quad renderer and
 * the component registry, none of which exist on ccpwgl's child path - and the
 * debug renderer holds the only three matrix compositions in the class.
 */
@meta.type("EveChildEffectPropagator")
@meta.define({
    wgl: "EveChildEffectPropagator",
    ccp: true
})
@meta.stage(2)
export class EveChildEffectPropagator extends EveChildContainer
{

    /** How spawn points are chosen. @see EveChildEffectPropagator.PropagationType */
    @meta.uint
    propagationType = 0;

    /**
     * When each spawn fires. The wire name is misspelled in Carbon
     * (`_Blue.cpp:45`) and that spelling is load-bearing.
     * @see EveChildEffectPropagator.TriggerType
     */
    @meta.uint
    triggerMethood = 0;

    /** The spawn template. */
    @meta.struct("EveChildInstanceContainer")
    effect = null;

    @meta.struct("Tr2CurveScalar")
    triggerSphereRadiusCurve = null;

    @meta.struct("EveLocatorSets")
    localLocators = null;

    @meta.float
    completeness = 1;

    @meta.vector3
    triggerSphereOffset = vec3.create();

    @meta.vector3
    effectScaling = vec3.fromValues(1, 1, 1);

    @meta.float
    randScaleMin = 1;

    @meta.float
    randScaleMax = 1;

    @meta.float
    stopToClearDelay = 0;

    @meta.boolean
    skipCleanup = false;

    @meta.boolean
    replayAfterDelay = false;

    /**
     * Number of random-spread samples. Carbon types this int64
     * (`h:125`), so it can arrive as a BigInt - every read below coerces.
     */
    @meta.uint
    numTriggers = 10;

    @meta.float
    range = 500;

    @meta.float
    minRangeThreshold = 0;

    /** Capital C is the wire name (`_Blue.cpp:65`). */
    @meta.float
    ClosenessPreference = 0.25;

    @meta.string
    locatorSetName = "";

    @meta.float
    frequency = 1;

    @meta.float
    durationPerEffect = 3;

    @meta.float
    stopAfterNumTriggers = -1;

    /** Set to fire; consumed on the next update. Not persisted. */
    @meta.boolean
    trigger = false;

    @meta.boolean
    isPlaying = false;

    @meta.float
    playTime = 0;

    /**
     * Recomputed by every `Process*Locators` path - NOT a user multiplier. It
     * scales both the curve value and the sphere offset, so leaving it at 1 gives
     * a sphere that never reaches a locator and nothing ever spawns.
     */
    @meta.float
    triggerSphereScalarMulti = 1;

    _processedTransforms = [];
    _currentTriggerIndex = 0;
    _delayTimer = 0;
    _numDeleted = 0;
    _lastTriggered = [];

    /**
     * Takes ownership of the effect container as a spawn template.
     * Carbon `Initialize` (`cpp:132-140`).
     */
    Initialize()
    {
        super.Initialize();
        this.TakeOwnershipOfEffect();
        return true;
    }

    /**
     * Stops the effect container from building its own instances.
     *
     * Carbon calls `DisableEditMode(true)` here (`cpp:70`, `:137`), which turns
     * off the container's editor fallback. ccpwgl's equivalent problem is
     * different and worse: `EveChildInstanceContainer.Update` rebuilds its
     * instance list from `locatorSet`/`transforms` whenever `_reset` is set, and
     * that rebuild would DISCARD every instance the propagator spawned. So the
     * flag is cleared here and must stay clear.
     */
    TakeOwnershipOfEffect()
    {
        if (this.effect) this.effect._reset = false;
    }

    /**
     * @returns {?EveChildInstanceContainer}
     */
    GetEffect()
    {
        return this.effect;
    }

    /**
     * Carbon `SetEffect` (`cpp:645-654`) brackets the swap with registry
     * un/registration, which ccpwgl's child path has no equivalent for.
     * @param {?EveChildInstanceContainer} effect
     */
    SetEffect(effect)
    {
        this.effect = effect || null;
        this.TakeOwnershipOfEffect();
    }

    /**
     * Carbon `OnModified` (`cpp:62-96`) clamps the authored ranges and re-anchors
     * playTime when the frequency changes.
     */
    OnModified()
    {
        this.completeness = Math.min(1, Math.max(0, this.completeness));
        this.randScaleMax = Math.max(this.randScaleMax, this.randScaleMin);
        this.randScaleMin = Math.min(Math.max(0, this.randScaleMin), this.randScaleMax);
        this.TakeOwnershipOfEffect();
        return true;
    }

    /**
     * Carbon `Play` (`cpp:102-114`).
     */
    Play()
    {
        this.Stop();
        if (!this.effect) return;

        this.trigger = false;
        this.isPlaying = true;
        this._delayTimer = this.stopToClearDelay;
    }

    /**
     * Carbon `Stop` (`cpp:120-130`) - clears the counters AND the spawned
     * instances.
     */
    Stop()
    {
        this.isPlaying = false;
        this.playTime = 0;
        this._currentTriggerIndex = 0;
        this._numDeleted = 0;

        if (this.effect && this.effect.ClearInstanceList) this.effect.ClearInstanceList();
    }

    /**
     * Fires an instance for every processed locator the growing sphere has
     * swallowed. Carbon `ManageTriggers` (`cpp:142-169`).
     *
     * The list is distance-sorted, which is what makes the `break` correct: the
     * first locator still outside the sphere means every later one is too.
     */
    ManageTriggers()
    {
        if (!this.triggerSphereRadiusCurve || !this.effect) return;

        const radius = Number(this.triggerSphereRadiusCurve.GetValueAt(this.playTime) || 0) * this.triggerSphereScalarMulti;
        const radiusSq = radius * radius;

        const records = this._processedTransforms;

        for (let i = this._currentTriggerIndex; i < records.length; i++)
        {
            const record = records[i];
            if (record.sqrDistToSphereCenter >= radiusSq) break;

            this.effect.CreateInstance(record.scale, record.rotation, record.position);
            this._currentTriggerIndex++;
        }
    }

    /**
     * Per frame update.
     *
     * Carbon splits this across `UpdateSyncronous` (consume the trigger, advance
     * the active method - `cpp:175-233`) and `UpdateAsyncronous` (transform, then
     * the base - `cpp:355-368`). ccpwgl has one `Update`, so both run here in
     * Carbon's order: trigger bookkeeping first, then the base, which is what
     * rebuilds the world transform and ticks curve sets and controllers.
     *
     * @param {Number} dt
     * @param {mat4} parentTransform
     * @param {Tw2PerObjectData} [perObjectData]
     * @param {EveShip2} [parentSpaceObject]
     */
    Update(dt, parentTransform, perObjectData, parentSpaceObject)
    {
        if (this.trigger)
        {
            this.ProcessLocators(parentSpaceObject);
            this.Play();

            if (this.triggerMethood === EveChildEffectPropagator.TriggerType.INTERVAL_TRIGGERS)
            {
                // Carbon (cpp:180-189): the ring holds floor(duration * frequency) slots primed with -1
                const size = Math.max(Math.floor(this.durationPerEffect * this.frequency), 0);
                this._lastTriggered.length = 0;
                for (let i = 0; i < size; i++) this._lastTriggered.push(-1);
            }
        }

        if (this.isPlaying)
        {
            switch (this.triggerMethood)
            {
                case EveChildEffectPropagator.TriggerType.TRIGGER_SPHERE_CURVE:
                    this.UpdateTriggerCurve(dt);
                    break;

                case EveChildEffectPropagator.TriggerType.INTERVAL_TRIGGERS:
                    if (this.frequency !== 0) this.UpdateTriggerInterval(dt);
                    else this.Stop();
                    break;

                case EveChildEffectPropagator.TriggerType.INSTANT_PERMANENT:
                    this.playTime += dt;
                    if (this._currentTriggerIndex === 0)
                    {
                        for (let i = 0; i < this._processedTransforms.length; i++)
                        {
                            const record = this._processedTransforms[i];
                            if (this.effect) this.effect.CreateInstance(record.scale, record.rotation, record.position);
                        }
                        this._currentTriggerIndex++;
                    }
                    break;

                default:
                    break;
            }
        }

        super.Update(dt, parentTransform, perObjectData, parentSpaceObject);
    }

    /**
     * Carbon `UpdateTriggerCurve` (`cpp:235-275`): advance, fire, then handle the
     * end of the curve - hold, replay after a delay with re-randomised sizes, or
     * stop.
     * @param {Number} dt
     */
    UpdateTriggerCurve(dt)
    {
        this.playTime += dt;

        if (this.effect) this.ManageTriggers();

        if (!this.triggerSphereRadiusCurve)
        {
            this.Stop();
            return;
        }

        if (this.playTime <= Number(this.triggerSphereRadiusCurve.Length() || 0)) return;

        if (this.skipCleanup) return;

        if (this.replayAfterDelay)
        {
            if (this._delayTimer > 0)
            {
                this._delayTimer -= dt;
            }
            else
            {
                this.RecalculateLocatorSizes();
                this.Play();
            }
            return;
        }

        this.Stop();
    }

    /**
     * Carbon `UpdateTriggerInterval` (`cpp:277-319`): frequency-paced spawning
     * from smart-random locators under a spawn cap, plus paced retirement of
     * expired instances until the two counters meet.
     * @param {Number} dt
     */
    UpdateTriggerInterval(dt)
    {
        this.playTime += dt;

        if (!this._processedTransforms.length) return;

        if (this.stopAfterNumTriggers > 0 && this.durationPerEffect !== -1
            && this.playTime > (this.stopAfterNumTriggers / this.frequency + this.durationPerEffect))
        {
            this.Stop();
            return;
        }

        if (this.playTime > this._currentTriggerIndex / this.frequency
            && (this._currentTriggerIndex < this.stopAfterNumTriggers || this.stopAfterNumTriggers < 0))
        {
            const index = this.GetSmartRandomLocatorIndex();

            if (this._lastTriggered.length) this._lastTriggered.shift();
            this._lastTriggered.push(index);

            const record = this._processedTransforms[index];
            if (this.effect) this.effect.CreateInstance(record.scale, record.rotation, record.position);
            this._currentTriggerIndex++;
        }

        if (this.durationPerEffect !== -1
            && this.playTime > (this._numDeleted / this.frequency) + this.durationPerEffect)
        {
            if (this.effect && this.effect.PopFront) this.effect.PopFront();
            this._numDeleted++;

            if (this._numDeleted === this._currentTriggerIndex)
            {
                // Carbon (cpp:313): the loop has drained, so start it over
                this._currentTriggerIndex = 0;
                this._lastTriggered.length = 0;
            }
        }
    }

    /**
     * Picks a locator index that has not fired recently.
     *
     * Carbon `GetSmartRandomLocatorIndex` (`cpp:321-353`) rejection-samples, with
     * an early exit to a plain draw when the history already covers the set or
     * the spawn rate saturates 75% of it - without that exit the loop could spin.
     *
     * `Math.random` stands in for Carbon's unseeded `TriRandInt`, which is the
     * established substitute in this organization and makes placement
     * non-reproducible across reloads.
     *
     * @returns {Number}
     */
    GetSmartRandomLocatorIndex()
    {
        const
            size = this._processedTransforms.length,
            historySize = this._lastTriggered.length;

        if (historySize >= size || this.frequency * this.durationPerEffect > 0.75 * size)
        {
            return Math.floor(Math.random() * size);
        }

        let index = -1;

        while (index === -1)
        {
            index = Math.floor(Math.random() * size);

            for (let i = 0; i < historySize; i++)
            {
                if (index === this._lastTriggered[i])
                {
                    index = -1;
                    break;
                }
            }
        }

        return index;
    }

    /**
     * Rebuilds the processed-locator list, then distance-sorts it.
     * Carbon `ProcessLocators` (`cpp:515-542`).
     *
     * The `Stop()` when nothing survives the completeness gate is Carbon's and is
     * load-bearing: without it a propagator spins on an empty list.
     *
     * @param {EveShip2} [parentSpaceObject]
     */
    ProcessLocators(parentSpaceObject)
    {
        this._processedTransforms.length = 0;

        switch (this.propagationType)
        {
            case EveChildEffectPropagator.PropagationType.LOCAL_LOCATORS:
                this.ProcessLocalLocators();
                break;

            case EveChildEffectPropagator.PropagationType.LOCATOR_SET_BY_REF:
                this.ProcessRefLocators(parentSpaceObject);
                break;

            case EveChildEffectPropagator.PropagationType.RANDOM_SPREAD:
                this.ProcessRandomSpreadLocators();
                break;

            default:
                break;
        }

        if (!this._processedTransforms.length)
        {
            this.Stop();
            return;
        }

        this.DistanceSortLocators();
    }

    /**
     * Carbon `ProcessLocalLocators` (`cpp:412-440`). The trigger-sphere scalar
     * becomes twice the distance of the farthest locator.
     */
    ProcessLocalLocators()
    {
        if (!this.localLocators) return;

        const locators = this.localLocators.locators || [];

        this.triggerSphereScalarMulti = 0;

        for (let i = 0; i < locators.length; i++)
        {
            const locator = locators[i];
            if (Math.random() > this.completeness) continue;

            const record = NewTransformRecord();
            vec3.copy(record.position, locator.position);
            this.triggerSphereScalarMulti = Math.max(this.triggerSphereScalarMulti, vec3.squaredLength(record.position));
            this.CopyLocatorRotation(record.rotation, locator);
            vec3.scale(record.scale, this.effectScaling, this.RandomScale());
            this._processedTransforms.push(record);
        }

        this.triggerSphereScalarMulti = Math.sqrt(this.triggerSphereScalarMulti) * 2;
    }

    /**
     * Carbon `ProcessRefLocators` (`cpp:442-480`): a named locator set on the
     * parent, defaulting to "damage", with the sphere scaled by the parent's
     * bounding radius.
     * @param {EveShip2} [parentSpaceObject]
     */
    ProcessRefLocators(parentSpaceObject)
    {
        if (this.locatorSetName === "") this.locatorSetName = "damage";

        if (!parentSpaceObject) return;

        const locators = EveChildInstanceContainer.GetLocatorsForSet(parentSpaceObject, this.locatorSetName);

        if (parentSpaceObject.GetBoundingSphereRadius)
        {
            this.triggerSphereScalarMulti = parentSpaceObject.GetBoundingSphereRadius() || 0;
        }

        if (!locators) return;

        for (let i = 0; i < locators.length; i++)
        {
            const locator = locators[i];
            if (Math.random() > this.completeness) continue;

            const record = NewTransformRecord();
            vec3.copy(record.position, locator.position);
            this.CopyLocatorRotation(record.rotation, locator);
            vec3.scale(record.scale, this.effectScaling, this.RandomScale());
            this._processedTransforms.push(record);
        }
    }

    /**
     * Carbon `ProcessRandomSpreadLocators` (`cpp:482-508`): uniform directions on
     * the unit sphere, pushed out by a closeness-biased distance inside
     * [minRangeThreshold, range].
     */
    ProcessRandomSpreadLocators()
    {
        const
            g = EveChildEffectPropagator.global,
            count = Number(this.numTriggers);

        for (let i = 0; i < count; i++)
        {
            if (Math.random() > this.completeness) continue;

            // Carbon (cpp:489-491): uniform, pulled toward the closeness
            // preference by a second draw, then mapped into the range
            let dist = Math.random();
            dist += (this.ClosenessPreference - dist) * Math.random();
            dist = this.minRangeThreshold + (this.range - this.minRangeThreshold) * dist;

            // Carbon (cpp:493-495): uniform unit-sphere direction from (a, z)
            const
                a = 2 * Math.PI * Math.random(),
                z = Math.random() * 2 - 1,
                s = Math.sqrt(1 - z * z);

            const record = NewTransformRecord();
            vec3.set(record.position, s * Math.cos(a) * dist, s * Math.sin(a) * dist, z * dist);
            vec3.set(g.vec3_0, s * Math.cos(a), s * Math.sin(a), z);
            PackDirection(record.rotation, g.vec3_0);
            vec3.scale(record.scale, this.effectScaling, this.RandomScale());
            this._processedTransforms.push(record);
        }

        this.triggerSphereScalarMulti = this.range;
    }

    /**
     * Re-randomises each locator's scale, for a delayed replay.
     * Carbon `RecalculateLocatorSizes` (`cpp:544-551`).
     */
    RecalculateLocatorSizes()
    {
        for (let i = 0; i < this._processedTransforms.length; i++)
        {
            vec3.scale(this._processedTransforms[i].scale, this.effectScaling, this.RandomScale());
        }
    }

    /**
     * Sorts locators by distance to the scaled trigger-sphere centre, ascending.
     * Carbon `DistanceSortLocators` (`cpp:558-566`). This ordering is what lets
     * `ManageTriggers` stop at the first locator outside the sphere.
     */
    DistanceSortLocators()
    {
        const centre = vec3.scale(EveChildEffectPropagator.global.vec3_1, this.triggerSphereOffset, this.triggerSphereScalarMulti);

        for (let i = 0; i < this._processedTransforms.length; i++)
        {
            const record = this._processedTransforms[i];
            record.sqrDistToSphereCenter = vec3.squaredDistance(record.position, centre);
        }

        this._processedTransforms.sort(SortByCircleDist);
    }

    /**
     * Copies a locator's orientation onto a record.
     *
     * Carbon reads `locator.direction` (`EveLocatorSets.h:8-14`); ccpwgl's
     * `EveLocatorSetItem` calls the same quaternion `rotation`
     * (`src/eve/item/EveLocatorSets.js:20-21`). A literal port of the Carbon line
     * yields undefined and silently unrotated spawns, so the name is resolved
     * here once rather than at three call sites.
     *
     * @param {quat} out
     * @param {*} locator
     * @returns {quat} out
     */
    CopyLocatorRotation(out, locator)
    {
        const rotation = locator.rotation || locator.direction;
        return rotation ? quat.copy(out, rotation) : quat.identity(out);
    }

    /**
     * @returns {Number} a scale factor in [randScaleMin, randScaleMax]
     */
    RandomScale()
    {
        return this.randScaleMin + Math.random() * (this.randScaleMax - this.randScaleMin);
    }

    /**
     * Sets a controller variable on the effect ONLY.
     * Carbon `SetControllerVariable` (`cpp:660-666`) does not call the base - the
     * effect container replaces the child fan-out.
     * @param {String} name
     * @param {Number} value
     */
    SetControllerVariable(name, value)
    {
        if (this.effect && this.effect.SetControllerVariable) this.effect.SetControllerVariable(name, value);
    }

    /**
     * Batches from the effect only, and nothing at all until something has
     * fired.
     *
     * Carbon `GetRenderables` (`cpp:399-410`) returns nothing while
     * `m_currentTriggerIndex == 0`. That gate matters here for a second reason:
     * `EveChildInstanceContainer.GetInstances` falls back to returning its SOURCE
     * when it holds no instances, so without this an untriggered propagator would
     * draw its template.
     *
     * @param {Number} mode
     * @param {Tw2BatchAccumulator} accumulator
     * @param {Tw2PerObjectData} perObjectData
     * @returns {Boolean}
     */
    GetBatches(mode, accumulator, perObjectData)
    {
        if (!this.display || !this._currentTriggerIndex || !this.effect) return false;
        return !!this.effect.GetBatches(mode, accumulator, perObjectData);
    }

    /**
     * @param {Array} [out=[]]
     * @returns {Array<Tw2Resource>} out
     */
    GetResources(out = [])
    {
        if (this.effect && this.effect.GetResources) this.effect.GetResources(out);
        return out;
    }

    static global = {
        vec3_0: vec3.create(),
        vec3_1: vec3.create()
    };

    /** Carbon `PropagationType` (`h:51-56`). */
    static PropagationType = {
        LOCAL_LOCATORS: 0,
        LOCATOR_SET_BY_REF: 1,
        RANDOM_SPREAD: 2
    };

    /** Carbon `TriggerType` (`h:58-63`). */
    static TriggerType = {
        TRIGGER_SPHERE_CURVE: 0,
        INTERVAL_TRIGGERS: 1,
        INSTANT_PERMANENT: 2
    };

}
