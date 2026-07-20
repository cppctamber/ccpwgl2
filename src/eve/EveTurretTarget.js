import { meta } from "utils";
import { vec3, mat4 } from "math";


/**
 * Resolves a turret's live target, damage locator and miss position.
 *
 * Carbon owns this state separately from EveTurretSet so that tracking,
 * firing effects and impacts all observe the same moving target.
 */
@meta.type("EveTurretTarget")
@meta.define({
    wgl: "EveTurretTarget",
    ccp: true
})
@meta.stage(2)
export class EveTurretTarget extends meta.Model
{

    @meta.vector3
    targetPosition = vec3.create();

    @meta.int32
    behaviour = 0;

    @meta.float
    positionOldInfluence = -1;

    @meta.vector3
    position = vec3.create();

    @meta.vector3
    positionOld = vec3.create();

    @meta.int32
    locator = -1;

    _targetable = null;
    _impactLength = -1;
    _impactDelay = -1;
    _impactID = -1;
    _positionMiss = vec3.create();
    _missQueue = [];
    _lastShotMissed = false;
    _lastShotTime = 0;
    _laserMissBehaviour = false;
    _projectileMissBehaviour = false;
    _impactSize = 0;
    _randomMissDistanceOffset = 0.5;
    _randomMissPositionOffset = vec3.create();

    /**
     * Gets the live target object
     * @returns {Object|null}
     */
    GetTargetable()
    {
        return this._targetable;
    }

    /**
     * Sets the live target object
     * @param {Object|null} object
     * @returns {Boolean}
     */
    SetTargetable(object)
    {
        if (!object)
        {
            this._targetable = null;
            return true;
        }

        if (!hasWorldPosition(object)) return false;

        if (object !== this._targetable)
        {
            this._targetable = object;
            vec3.copy(this.positionOld, this.position);
            this.positionOldInfluence = 1;
        }
        return true;
    }

    /**
     * Sets a fixed world-space target and clears any live target object
     * @param {vec3} value
     */
    SetTargetPosition(value)
    {
        this._targetable = null;
        vec3.copy(this.targetPosition, value);
        vec3.copy(this.position, value);
        this.positionOldInfluence = -1;
    }

    /**
     * Gets the active damage locator
     * @returns {Number}
     */
    GetLocator()
    {
        return this.locator;
    }

    /**
     * Starts one shot at a damage locator
     * @param {Number} locator
     * @param {Number} delay
     * @param {Number} length
     * @param {vec3} source
     */
    StartFireAtLocator(locator, delay, length, source = EveTurretTarget.global.zero)
    {
        this.locator = Number(locator) | 0;
        this._randomMissDistanceOffset = Math.random();

        const u = Math.random();
        const v = Math.random();
        const phi = u * Math.PI * 2;
        const theta = Math.acos(1 - Math.sqrt(v)) * 2;
        const sinPhi = Math.sin(phi) * 3;
        vec3.set(
            this._randomMissPositionOffset,
            sinPhi * Math.cos(theta),
            Math.cos(phi) * 3,
            sinPhi * Math.sin(theta)
        );

        this._impactID = -1;
        if (!this.PopShotMissed() && this._impactSize > 0 && this._targetable)
        {
            this._impactLength = Math.max(Number(length) || 0, 0);
            this._impactDelay = Number(delay) || 0;
            if (this._impactDelay === 0)
            {
                this.GetImpactPosition(source, this.targetPosition);
                if (this.behaviour === EveTurretTarget.ImpactBehaviour.DAMAGE_LOCATOR)
                {
                    vec3.subtract(EveTurretTarget.global.direction, source, this.targetPosition);
                    this._impactID = Number(this._targetable.CreateImpact?.(
                        this.locator,
                        EveTurretTarget.global.direction,
                        this._impactLength,
                        this._impactSize
                    ) ?? -1) | 0;
                    this._impactDelay = -1;
                }
            }
        }
    }

    /**
     * Stops firing and clears shot-local state
     */
    StopFireAtLocator()
    {
        this.locator = -1;
        this.positionOldInfluence = -1;
        this._lastShotMissed = false;
        this._missQueue.length = 0;
        this._impactID = -1;
        this._impactDelay = -1;
    }

    /**
     * Resolves the current impact position
     * @param {vec3} source
     * @param {vec3} out
     * @returns {vec3}
     */
    GetImpactPosition(source = EveTurretTarget.global.zero, out = vec3.create())
    {
        const target = this._targetable;
        if (!target) return vec3.copy(out, this.targetPosition);

        if (this.behaviour === EveTurretTarget.ImpactBehaviour.DAMAGE_LOCATOR)
        {
            if (!getDamageLocatorPosition(target, out, this.locator, true)) getWorldPosition(target, out);
        }
        else if (this.behaviour === EveTurretTarget.ImpactBehaviour.CENTER)
        {
            getWorldPosition(target, out);
        }
        else
        {
            getWorldPosition(target, EveTurretTarget.global.worldPosition);
            const hit = target.GetImpactPosition?.(
                out,
                this.locator,
                source,
                EveTurretTarget.global.worldPosition,
                0
            );
            if (hit === false || hit === undefined)
            {
                if (!getDamageLocatorPosition(target, out, this.locator, true)) getWorldPosition(target, out);
            }
        }
        return out;
    }

    /**
     * Updates live hit/miss positions
     * @param {Number} dt
     * @param {vec3} source
     * @returns {vec3}
     */
    Update(dt, source = EveTurretTarget.global.zero)
    {
        dt = Number(dt) || 0;
        const target = this._targetable;

        if (target)
        {
            this.GetImpactPosition(source, this.targetPosition);
            vec3.subtract(EveTurretTarget.global.direction, source, this.targetPosition);

            const miss = target.GetMissPosition?.(this._positionMiss, this.targetPosition, source);
            if (miss?.length >= 3 && miss !== this._positionMiss) vec3.copy(this._positionMiss, miss);
            else if (!target.GetMissPosition) vec3.copy(this._positionMiss, this.targetPosition);

            vec3.add(this._positionMiss, this._positionMiss, this._randomMissPositionOffset);
            vec3.subtract(EveTurretTarget.global.missDirection, this._positionMiss, source);
            const distance = vec3.length(EveTurretTarget.global.missDirection);
            if (distance) vec3.scale(EveTurretTarget.global.missDirection, EveTurretTarget.global.missDirection, 1 / distance);

            vec3.scaleAndAdd(
                this._positionMiss,
                this._positionMiss,
                EveTurretTarget.global.missDirection,
                this._laserMissBehaviour
                    ? 250000
                    : (distance + 5000) * (1 + 0.5 * this._randomMissDistanceOffset)
            );

            if (this.behaviour === EveTurretTarget.ImpactBehaviour.DAMAGE_LOCATOR)
            {
                if (this._impactID !== -1)
                {
                    target.UpdateImpact?.(this.targetPosition, EveTurretTarget.global.direction, this._impactID);
                }
                if (this._impactDelay > 0 && this._impactSize > 0)
                {
                    this._impactDelay -= dt;
                    if (this._impactDelay < 0)
                    {
                        this._impactID = Number(target.CreateImpact?.(
                            this.locator,
                            EveTurretTarget.global.direction,
                            this._impactLength,
                            this._impactSize
                        ) ?? -1) | 0;
                        this._impactDelay = -1;
                    }
                }
            }
        }

        vec3.copy(this.position, this.targetPosition);
        if (this.positionOldInfluence > 0)
        {
            vec3.lerp(this.position, this.targetPosition, this.positionOld, this.positionOldInfluence);
            this.positionOldInfluence -= dt;
        }
        return this.position;
    }

    GetTrackingPosition(out)
    {
        return copyOrReturn(this.GetShotMissed() ? this._positionMiss : this.position, out);
    }

    GetTargetPosition(out)
    {
        return copyOrReturn(this.GetShotMissed() ? this._positionMiss : this.targetPosition, out);
    }

    FindClosestLocator(source, out = vec3.create())
    {
        if (!this._targetable) return -1;
        const locator = Number(this._targetable.GetClosestDamageLocatorIndex?.(source) ?? -1) | 0;
        return getDamageLocatorPosition(this._targetable, out, locator, true) ? locator : -1;
    }

    FindRandomValidLocator(source, out = vec3.create())
    {
        if (!this._targetable) return -1;
        let locator = Number(this._targetable.GetGoodDamageLocatorIndex?.(source) ?? -1) | 0;
        if (getDamageLocatorPosition(this._targetable, out, locator, true)) return locator;
        locator = Number(this._targetable.GetClosestDamageLocatorIndex?.(source) ?? -1) | 0;
        return getDamageLocatorPosition(this._targetable, out, locator, true) ? locator : -1;
    }

    SetBehaviour(laserMiss, projectileMiss, impactSize, impactBehaviour)
    {
        this._laserMissBehaviour = !!laserMiss;
        this._projectileMissBehaviour = !!projectileMiss;
        this._impactSize = Number(impactSize) || 0;
        this.behaviour = Number(impactBehaviour) | 0;
    }

    PopShotMissed()
    {
        this._lastShotMissed = this._missQueue.length ? this._missQueue.shift() : false;
        return this._lastShotMissed;
    }

    GetShotMissed()
    {
        return this._lastShotMissed;
    }

    SetShotMissed(missed, timestamp = Date.now() / 1000)
    {
        this._missQueue.push(!!missed);
        this._lastShotTime = Number(timestamp);
        while (this._missQueue.length > 4) this._missQueue.shift();
    }

    GetLastShotTime()
    {
        return this._lastShotTime;
    }

    MissQueueSize()
    {
        return this._missQueue.length;
    }

    GetRadius()
    {
        return Number(this._targetable?.GetRadius?.() ?? -1);
    }

    GetImpactConfiguration()
    {
        return this._targetable?.GetImpactConfiguration?.() ?? EveTurretTarget.ImpactConfiguration.IMPACT_INVALID;
    }

    ShowDestObject()
    {
        return !(this._projectileMissBehaviour && this.GetShotMissed());
    }

    static ImpactBehaviour = Object.freeze({
        DAMAGE_LOCATOR: 0,
        SHIELD_ELLIPSOID: 1,
        CENTER: 2
    });

    static ImpactConfiguration = Object.freeze({
        IMPACT_INVALID: 0,
        IMPACT_SHIELD: 1,
        IMPACT_ARMOR: 2,
        IMPACT_HULL: 3
    });

    static global = {
        zero: vec3.create(),
        direction: vec3.create(),
        missDirection: vec3.create(),
        worldPosition: vec3.create(),
        worldTransform: mat4.create()
    };

}


function hasWorldPosition(object)
{
    return typeof object.GetWorldTranslation === "function" ||
        typeof object.GetWorldTransform === "function" ||
        typeof object.GetTransform === "function" ||
        object.worldPosition?.length >= 3 ||
        object.position?.length >= 3;
}


function getWorldPosition(object, out)
{
    if (typeof object?.GetWorldTranslation === "function")
    {
        const value = object.GetWorldTranslation(out);
        if (value?.length >= 3 && value !== out) vec3.copy(out, value);
    }
    else if (typeof object?.GetWorldTransform === "function")
    {
        object.GetWorldTransform(EveTurretTarget.global.worldTransform);
        mat4.getTranslation(out, EveTurretTarget.global.worldTransform);
    }
    else if (typeof object?.GetTransform === "function")
    {
        object.GetTransform(EveTurretTarget.global.worldTransform);
        mat4.getTranslation(out, EveTurretTarget.global.worldTransform);
    }
    else
    {
        const value = object?.worldPosition ?? object?.position;
        if (value?.length >= 3) vec3.copy(out, value);
    }
    return out;
}


function getDamageLocatorPosition(object, out, locator, worldSpace)
{
    if (typeof object?.GetDamageLocatorPosition !== "function") return false;
    const value = object.GetDamageLocatorPosition(out, locator, worldSpace);
    if (value?.length >= 3 && value !== out) vec3.copy(out, value);
    return value !== false;
}


function copyOrReturn(value, out)
{
    return out ? vec3.copy(out, value) : value;
}
