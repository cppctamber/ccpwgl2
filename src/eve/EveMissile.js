import { meta } from "utils";
import { vec3, vec4, quat, mat4, sph3, noise } from "math";
import { GLESPerObjectDataEveMissileWarhead } from "core";


@meta.type("EveMissileWarhead")
@meta.define({
    wgl: "EveMissileWarhead",
    ccp: true
})
@meta.stage(2)
export class EveMissileWarhead extends meta.Model
{

    @meta.string
    name = "";

    @meta.boolean
    display = true;

    @meta.float
    pathOffsetNoiseScale = 0;

    @meta.float
    pathOffsetNoiseSpeed = 1;

    @meta.boolean
    startDataValid = false;

    @meta.vector3
    pathOffset = vec3.create();

    @meta.float
    maxExplosionDistance = 40;

    @meta.float
    impactDuration = 0.6;

    @meta.vector3
    explosionPosition = vec3.create();

    @meta.float
    impactSize = 0;

    @meta.struct("Tw2Mesh")
    mesh = null;

    @meta.list("Tw2ParticleEmitter")
    particleEmitters = [];

    @meta.struct("EveSpriteSet")
    spriteSet = null;

    @meta.int32
    targetLocatorID = -1;

    @meta.float
    durationEjectPhase = 0;

    @meta.boolean
    doSpread = true;

    @meta.float
    acceleration = 1;

    @meta.int32
    id = -1;

    @meta.float
    startEjectVelocity = 0;

    @meta.float
    warheadLength = 1;

    @meta.float
    warheadRadius = 1;

    _perObjectData = new GLESPerObjectDataEveMissileWarhead();
    _state = EveMissileWarhead.State.STATE_DELAYED;
    _flyingTime = 0;
    _movement = vec3.create();
    _positionLastFrame = vec3.create();
    _lastRelativePosition = vec3.create();
    _currentStartOffset = vec3.create();
    _startOrientation = quat.create();
    _oldEndOffset = vec3.create();
    _currentEndOffset = vec3.create();
    _endOffset = vec3.create();
    _currentOffset = vec3.create();
    _currentOrientation = quat.create();
    _currentEjectVelocity = 0;
    _currentDurationEjectPhase = 0;
    _currentOffsetTransform = mat4.create();
    _transform = mat4.create();
    _transformLast = mat4.create();
    _finalDestinationTimer = 0;
    _finalTargetTime = 0.75 - Math.random() * 0.1;
    _speedModifier = 1.04 - Math.random() * 0.08;
    _explosionDistance = 0;
    _bombFlightpath = false;
    _lastPositionValid = false;
    _noisePhase = EveMissileWarhead._nextNoisePhase++ & 0xfff;

    Initialize()
    {
        if (this.spriteSet) this.spriteSet.UseQuads(true);
        this.EnableParticleEmitting(false);
    }

    /**
     * Resets Carbon's per-launch state before a muzzle transform is assigned
     */
    PrepareLaunch()
    {
        this._currentEjectVelocity = this.startEjectVelocity;
        this._currentDurationEjectPhase = this.durationEjectPhase;
        const distance = this.maxExplosionDistance - Math.random() * this.maxExplosionDistance * 0.5;
        this._explosionDistance = distance * distance;
        this._state = EveMissileWarhead.State.STATE_DELAYED;
        this._flyingTime = 0;
        vec3.set(this._currentStartOffset, 0, 0, 0);
        quat.identity(this._startOrientation);
        this.startDataValid = false;
        vec3.set(this._oldEndOffset, 0, 0, 0);
        vec3.set(this._currentEndOffset, 0, 0, 0);
        vec3.set(this._endOffset, 0, 0, 0);
        vec3.set(this._currentOffset, 0, 0, 0);
        vec3.set(this.pathOffset, 0, 0, 0);
        quat.identity(this._currentOrientation);
        this._finalDestinationTimer = 0;
        this.targetLocatorID = -1;
        vec3.set(this.explosionPosition, 0, 0, 0);
        mat4.identity(this._currentOffsetTransform);
        mat4.identity(this._transform);
        mat4.identity(this._transformLast);
        this._speedModifier = 1.04 - Math.random() * 0.08;
        this._finalTargetTime = 0.75 - Math.random() * 0.1;
        this._bombFlightpath = false;
        this._lastPositionValid = false;
        this.EnableParticleEmitting(false);
    }

    /**
     * Assigns Carbon's missile-local muzzle transform
     * @param {mat4} startTransform
     */
    Launch(startTransform)
    {
        mat4.getRotation(this._startOrientation, startTransform);
        vec3.set(this._currentStartOffset, startTransform[12], startTransform[13], startTransform[14]);
        quat.copy(this._currentOrientation, this._startOrientation);
        vec3.copy(this._currentOffset, this._currentStartOffset);
        vec3.copy(this._lastRelativePosition, this._currentStartOffset);
        this.startDataValid = true;
        this._lastPositionValid = false;
    }

    UpdateEndTransform(endTransform, switchLocators)
    {
        vec3.set(this._endOffset, endTransform[12], endTransform[13], endTransform[14]);
        if (switchLocators)
        {
            this._finalDestinationTimer = this._flyingTime;
            vec3.copy(this._oldEndOffset, this._currentEndOffset);
        }
    }

    UpdateState(dt, estimatedTotalAliveTime, target)
    {
        this._bombFlightpath = !target;
        let event = EveMissileWarhead.StateChangeEvent.EVT_NONE;
        const totalFlyingTime = Math.max((Number(estimatedTotalAliveTime) + 0.1) * this._speedModifier, Number.EPSILON);
        const flight = clamp01(this._flyingTime / totalFlyingTime);

        switch (this._state)
        {
            case EveMissileWarhead.State.STATE_DELAYED:
                if (this.startDataValid) this._state = EveMissileWarhead.State.STATE_LAUNCH;
                break;

            case EveMissileWarhead.State.STATE_LAUNCH:
                this.EnableParticleEmitting(true);
                this._state = EveMissileWarhead.State.STATE_EJECTING;
                break;

            case EveMissileWarhead.State.STATE_EJECTING:
                this._currentDurationEjectPhase -= Number(dt) || 0;
                if (this._currentDurationEjectPhase <= 0)
                {
                    this._currentDurationEjectPhase = 0;
                    this._state = EveMissileWarhead.State.STATE_START_TRACKING;
                }
                break;

            case EveMissileWarhead.State.STATE_START_TRACKING:
                this.targetLocatorID = target
                    ? Number(target.GetGoodDamageLocatorIndex?.(this.GetWorldPosition(EveMissileWarhead.global.positionNow)) ?? -1) | 0
                    : -1;
                this._state = estimatedTotalAliveTime >= 5 && this.doSpread
                    ? EveMissileWarhead.State.STATE_TRACKING_SPREAD
                    : EveMissileWarhead.State.STATE_TRACKING_FINAL;
                break;

            case EveMissileWarhead.State.STATE_TRACKING_SPREAD:
                if (flight >= this._finalTargetTime)
                {
                    this.targetLocatorID = target
                        ? Number(target.GetGoodDamageLocatorIndex?.(this.GetWorldPosition(EveMissileWarhead.global.positionNow)) ?? -1) | 0
                        : -1;
                    event = EveMissileWarhead.StateChangeEvent.EVT_SWITCH_TARGET;
                    this._state = EveMissileWarhead.State.STATE_TRACKING_FINAL;
                }
                break;

            case EveMissileWarhead.State.STATE_EXPLODED:
                this._state = EveMissileWarhead.State.STATE_DEAD;
                this.EnableParticleEmitting(false);
                break;
        }
        return event;
    }

    CheckImpact(dt, estimatedTotalAliveTime, target)
    {
        if (this._state !== EveMissileWarhead.State.STATE_TRACKING_FINAL || this.id < 0)
        {
            return EveMissileWarhead.StateChangeEvent.EVT_NONE;
        }

        const g = EveMissileWarhead.global;
        const totalFlyingTime = Math.max((Number(estimatedTotalAliveTime) + 0.1) * this._speedModifier, Number.EPSILON);
        const flight = clamp01((this._flyingTime - (Number(dt) || 0)) / totalFlyingTime);
        const positionNow = this.GetWorldPosition(g.positionNow);

        if (!target)
        {
            vec3.copy(this.explosionPosition, positionNow);
            this._state = EveMissileWarhead.State.STATE_EXPLODED;
            return EveMissileWarhead.StateChangeEvent.EVT_EXPLODE;
        }

        vec3.subtract(g.positionLast, positionNow, this._movement);
        vec3.copy(g.targetPosition, positionNow);
        const hit = target.GetImpactPosition?.(
            g.targetPosition,
            this.targetLocatorID,
            g.positionLast,
            positionNow,
            this._explosionDistance
        ) ?? false;
        if (flight < 1 && !hit) return EveMissileWarhead.StateChangeEvent.EVT_NONE;

        vec3.copy(this.explosionPosition, positionNow);
        vec3.subtract(g.impactDirection, g.targetPosition, positionNow);
        if (vec3.dot(g.impactDirection, this._movement) < 0) vec3.copy(this.explosionPosition, g.targetPosition);
        if (this.impactSize > 0)
        {
            vec3.negate(g.impactDirection, this._movement);
            target.CreateImpact?.(this.targetLocatorID, g.impactDirection, this.impactDuration, this.impactSize);
        }

        this._state = EveMissileWarhead.State.STATE_EXPLODED;
        return EveMissileWarhead.StateChangeEvent.EVT_EXPLODE;
    }

    /**
     * Updates Carbon's three phase-shifted 1D Perlin path offsets and children
     * @param {Number} dt
     */
    Update(dt)
    {
        const position = this._flyingTime * this.pathOffsetNoiseSpeed + this._noisePhase;
        this.pathOffset[0] = noise.perlin1D(position, 1.1, 2, 3) * this.pathOffsetNoiseScale;
        this.pathOffset[1] = noise.perlin1D(position + 10.1, 1.1, 2, 3) * this.pathOffsetNoiseScale;
        this.pathOffset[2] = noise.perlin1D(position + 18.3, 1.1, 2, 3) * this.pathOffsetNoiseScale;

        this.GetWorldPosition(EveMissileWarhead.global.positionNow);
        vec3.subtract(this._movement, EveMissileWarhead.global.positionNow, this._positionLastFrame);
        vec3.copy(this._positionLastFrame, EveMissileWarhead.global.positionNow);

        for (let i = 0; i < this.particleEmitters.length; i++)
        {
            this.particleEmitters[i].Update?.(dt);
        }
        this.spriteSet?.Update?.(dt);
    }

    /**
     * Runs Carbon's eject, spread, tracking and orientation flight calculation
     */
    UpdateWarhead(dt, estimatedTotalAliveTime, currentBallVelocity, currentInheritedVelocity, inverseBallRotation, missileTransform)
    {
        dt = Number(dt) || 0;
        const g = EveMissileWarhead.global;

        vec3.set(g.ejectVelocity, 0, 0, this._currentEjectVelocity);
        vec3.transformQuat(g.ejectVelocity, g.ejectVelocity, this._startOrientation);
        transformNormal(g.globalBallVelocity, currentBallVelocity, inverseBallRotation);
        if (this._state >= EveMissileWarhead.State.STATE_START_TRACKING) this._flyingTime += dt;

        const totalFlyingTime = Math.max((Number(estimatedTotalAliveTime) + 0.1) * this._speedModifier, Number.EPSILON);
        const flight = clamp01(this._flyingTime / totalFlyingTime);
        const quickFlight = clamp01(3 * flight);

        if (this._state >= EveMissileWarhead.State.STATE_EJECTING)
        {
            vec3.scaleAndAdd(this._currentStartOffset, this._currentStartOffset, g.ejectVelocity, dt);
        }
        vec3.scaleAndAdd(this._currentStartOffset, this._currentStartOffset, currentInheritedVelocity, dt);

        const denominator = totalFlyingTime - this._finalDestinationTimer;
        const targetTime = denominator ? clamp01((this._flyingTime - this._finalDestinationTimer) / denominator) : 1;
        vec3.scale(g.modifiedOldOffset, this._oldEndOffset, 1 - clamp01(targetTime * 2));
        vec3.lerp(this._currentEndOffset, g.modifiedOldOffset, this._endOffset, targetTime);
        vec3.lerp(this._currentOffset, this._currentStartOffset, this._currentEndOffset, Math.pow(flight, 1 + this.acceleration));

        vec3.scale(g.globalBallVelocity, g.globalBallVelocity, 1 - flight);
        vec3.scaleAndAdd(this._currentStartOffset, this._currentStartOffset, g.globalBallVelocity, -dt);
        this._currentEjectVelocity = this.startEjectVelocity * (1 - Math.pow(quickFlight, 1 + this.acceleration));
        vec3.scaleAndAdd(this._currentOffset, this._currentOffset, this.pathOffset, Math.sin(Math.PI * flight) ** 2);
        if (this._bombFlightpath) vec3.scale(this._currentOffset, this._currentOffset, (1 - quickFlight) ** 2);

        vec3.transformMat4(g.relativePosition, this._currentOffset, missileTransform);
        vec3.subtract(g.translation, this._lastRelativePosition, g.relativePosition);
        vec3.copy(this._lastRelativePosition, g.relativePosition);

        if (this._lastPositionValid && this.startDataValid)
        {
            const distanceSquared = vec3.squaredLength(g.translation);
            if (distanceSquared > 0)
            {
                transformNormal(g.translation, g.translation, inverseBallRotation);
                mat4.arcFromForward(g.orientationMatrix, g.translation);
                mat4.getRotation(g.orientationNow, g.orientationMatrix);
                if (distanceSquared < 1)
                {
                    quat.slerp(this._currentOrientation, this._currentOrientation, g.orientationNow, distanceSquared);
                    quat.normalize(this._currentOrientation, this._currentOrientation);
                }
                else
                {
                    quat.copy(this._currentOrientation, g.orientationNow);
                }
            }
        }
        else
        {
            this._lastPositionValid = true;
        }

        mat4.copy(this._transformLast, this._transform);
        mat4.fromRotationTranslation(this._currentOffsetTransform, this._currentOrientation, this._currentOffset);
        mat4.multiply(this._transform, missileTransform, this._currentOffsetTransform);
    }

    EnableParticleEmitting(enable)
    {
        for (let i = 0; i < this.particleEmitters.length; i++) enableEmitter(this.particleEmitters[i], enable);
    }

    GetWorldPosition(out = vec3.create())
    {
        return mat4.getTranslation(out, this._transform);
    }

    GetCurrentOffsetTransform()
    {
        return this._currentOffsetTransform;
    }

    GetTargetLocator()
    {
        return this.targetLocatorID;
    }

    SetTargetLocator(locator)
    {
        this.targetLocatorID = Number(locator) | 0;
    }

    GetState()
    {
        return this._state;
    }

    GetWarheadID()
    {
        return this.id;
    }

    GetResources(out = [])
    {
        this.mesh?.GetResources?.(out);
        this.spriteSet?.GetResources?.(out);
        for (let i = 0; i < this.particleEmitters.length; i++)
        {
            this.particleEmitters[i].GetResources?.(out);
        }
        return out;
    }

    UpdateViewDependentData()
    {
        if (!this.display || this._state === EveMissileWarhead.State.STATE_DEAD) return;

        mat4.transpose(this._perObjectData.vs.Get("WorldMat"), this._transform);
        mat4.transpose(this._perObjectData.vs.Get("WorldMatLast"), this._transformLast);
        const vsShipData = this._perObjectData.vs.Get("Shipdata");
        const psShipData = this._perObjectData.ps.Get("Shipdata");
        vsShipData[0] = psShipData[0] = this.warheadRadius;
        vsShipData[1] = psShipData[1] = this.warheadLength;

        this.spriteSet?.UpdateViewDependentData?.(this._transform);
    }

    GetBatches(mode, accumulator)
    {
        if (!this.display || this._state === EveMissileWarhead.State.STATE_DEAD) return false;

        const count = accumulator.length;
        this.mesh?.GetBatches?.(mode, accumulator, this._perObjectData);
        this.spriteSet?.GetBatches?.(mode, accumulator, this._perObjectData, this._transform);
        return accumulator.length !== count;
    }

    GetLocalBoundingSphere(out = vec4.create())
    {
        vec4.set(EveMissileWarhead.global.localSphere, 0, 0, this.warheadLength * 0.5, this.warheadLength * 0.5);
        sph3.transformMat4(out, EveMissileWarhead.global.localSphere, this._currentOffsetTransform);
        return out;
    }

    static perObjectData = GLESPerObjectDataEveMissileWarhead.layout;

    static State = Object.freeze({
        STATE_DELAYED: 0,
        STATE_LAUNCH: 1,
        STATE_EJECTING: 2,
        STATE_START_TRACKING: 3,
        STATE_TRACKING_SPREAD: 4,
        STATE_TRACKING_FINAL: 5,
        STATE_EXPLODED: 6,
        STATE_DEAD: 7
    });

    static StateChangeEvent = Object.freeze({
        EVT_SWITCH_TARGET: 0,
        EVT_EXPLODE: 1,
        EVT_NONE: 2
    });

    static _nextNoisePhase = 1;

    static global = {
        localSphere: vec4.create(),
        positionNow: vec3.create(),
        positionLast: vec3.create(),
        targetPosition: vec3.create(),
        impactDirection: vec3.create(),
        ejectVelocity: vec3.create(),
        globalBallVelocity: vec3.create(),
        modifiedOldOffset: vec3.create(),
        relativePosition: vec3.create(),
        translation: vec3.create(),
        orientationNow: quat.create(),
        orientationMatrix: mat4.create()
    };

}


@meta.type("EveMissile")
@meta.define({
    wgl: "EveMissile",
    ccp: true
})
@meta.stage(2)
export class EveMissile extends meta.Model
{

    @meta.string
    name = "";

    @meta.boolean
    display = true;

    @meta.vector3
    @meta.isPrivate
    boundingSphereCenter = vec3.create();

    @meta.float
    @meta.isPrivate
    boundingSphereRadius = 0;

    @meta.struct("Tr2TranslationAdapter")
    translationCurve = null;

    @meta.struct("Tr2RotationAdapter")
    rotationCurve = null;

    @meta.struct("Tr2TranslationAdapter")
    modelTranslationCurve = null;

    @meta.list("EveMissileWarhead")
    warheads = [];

    @meta.list("Tw2CurveSet")
    curveSets = [];

    @meta.boolean
    updateWarheads = true;

    target = null;

    @meta.float
    targetRadius = 0;

    explosionCallback = null;

    _worldTransform = mat4.create();
    _worldTransformLast = mat4.create();
    _position = vec3.create();
    _velocity = vec3.create();
    _rotation = quat.create();
    _inheritedStartVelocity = vec3.create();
    _inheritedVelocity = vec3.create();
    _time = 0;
    _estimatedTotalAliveTime = 1;
    _lastValidSpeed = 0;
    _warheadExplosionCallback = null;
    _missileFinishedCallback = null;
    _finishedNotified = false;

    Initialize()
    {
        for (let i = 0; i < this.warheads.length; i++)
        {
            this.warheads[i]?.EnableParticleEmitting(false);
        }
    }

    /**
     * Starts Carbon's missile clock and inherited ship velocity
     * @param {vec3} shipVelocity
     * @param {Number} estimatedFlyingTime
     */
    Start(shipVelocity, estimatedFlyingTime)
    {
        vec3.copy(this._inheritedVelocity, shipVelocity ?? EveMissile.global.zero);
        vec3.copy(this._inheritedStartVelocity, this._inheritedVelocity);
        this._estimatedTotalAliveTime = Number(estimatedFlyingTime) || 0;
        this._time = 0;
        this._lastValidSpeed = 0;
        this._finishedNotified = false;

        for (let i = 0; i < this.warheads.length; i++)
        {
            this.warheads[i]?.EnableParticleEmitting(false);
        }
    }

    OnWarheadExplosion(callback)
    {
        this._warheadExplosionCallback = callback;
    }

    OnMissileFinished(callback)
    {
        this._missileFinishedCallback = callback;
    }

    GetResources(out = [])
    {
        for (let i = 0; i < this.warheads.length; i++) this.warheads[i]?.GetResources(out);
        return out;
    }

    UpdateViewDependentData()
    {
        for (let i = 0; i < this.warheads.length; i++) this.warheads[i]?.UpdateViewDependentData();
    }

    /**
     * Combined ccpwgl update for Carbon's synchronous missile/warhead phases
     * @param {Number} dt
     */
    Update(dt)
    {
        dt = Number(dt) || 0;
        this._time += dt;

        const g = EveMissile.global;
        mat4.copy(this._worldTransformLast, this._worldTransform);
        vec3.copy(g.positionLast, this._position);

        if (this.translationCurve)
        {
            sampleCurve(this.translationCurve, this._time, this._position, this._position);
        }
        else
        {
            mat4.getTranslation(this._position, this._worldTransform);
        }

        if (this.rotationCurve) sampleCurve(this.rotationCurve, this._time, this._rotation, g.identityRotation);
        mat4.fromRotationTranslation(this._worldTransform, this._rotation, this._position);

        if (this.modelTranslationCurve)
        {
            sampleCurve(this.modelTranslationCurve, this._time, g.modelTranslation, g.zero);
            vec3.transformQuat(g.modelTranslation, g.modelTranslation, this._rotation);
            this._worldTransform[12] += g.modelTranslation[0];
            this._worldTransform[13] += g.modelTranslation[1];
            this._worldTransform[14] += g.modelTranslation[2];
        }

        if (this.translationCurve?.GetValueDotAt)
        {
            this.translationCurve.GetValueDotAt(this._time, this._velocity);
        }
        else if (dt > 0)
        {
            vec3.subtract(this._velocity, this._position, g.positionLast);
            vec3.scale(this._velocity, this._velocity, 1 / dt);
        }
        else
        {
            vec3.set(this._velocity, 0, 0, 0);
        }

        resolveTargetPosition(this.target, g.targetPosition);
        const speed = vec3.length(this._velocity);
        if (this.target && speed > 0)
        {
            const radius = this.targetRadius || Number(this.target.GetRadius?.() ?? 0);
            this._estimatedTotalAliveTime = this._time + Math.max(0, vec3.distance(this._position, g.targetPosition) - radius) / speed;
            this._lastValidSpeed = speed;
        }
        else if (this.target && this._lastValidSpeed > 0)
        {
            vec3.subtract(this._velocity, g.targetPosition, this._position);
            const length = vec3.length(this._velocity);
            if (length) vec3.scale(this._velocity, this._velocity, this._lastValidSpeed / length);
        }

        quat.invert(g.inverseRotationQuat, this._rotation);
        mat4.fromQuat(g.inverseBallRotation, g.inverseRotationQuat);

        for (let i = 0; i < this.curveSets.length; i++) this.curveSets[i].UpdateDelta(dt);

        let exploded = false;
        for (let i = 0; i < this.warheads.length; i++)
        {
            const warhead = this.warheads[i];
            if (!warhead) continue;

            const event = warhead.UpdateState(dt, this._estimatedTotalAliveTime, this.target);
            if (warhead.GetState() !== EveMissileWarhead.State.STATE_DEAD)
            {
                vec3.copy(g.locatorPosition, g.targetPosition);
                if (this.target)
                {
                    getDamageLocatorPosition(this.target, g.locatorPosition, warhead.GetTargetLocator(), true);
                }

                vec3.subtract(g.locatorOffset, g.locatorPosition, this._position);
                transformNormal(g.locatorOffset, g.locatorOffset, g.inverseBallRotation);
                mat4.fromTranslation(g.locatorTransform, g.locatorOffset);
                warhead.UpdateEndTransform(g.locatorTransform, event === EveMissileWarhead.StateChangeEvent.EVT_SWITCH_TARGET);

                if (this.updateWarheads)
                {
                    warhead.UpdateWarhead(
                        dt,
                        this._estimatedTotalAliveTime,
                        this._velocity,
                        this._inheritedVelocity,
                        g.inverseBallRotation,
                        this._worldTransform
                    );
                }
                warhead.Update(dt);
            }

            if (warhead.CheckImpact(dt, this._estimatedTotalAliveTime, this.target) === EveMissileWarhead.StateChangeEvent.EVT_EXPLODE)
            {
                exploded = true;
                callCallback(this.explosionCallback, warhead.GetWarheadID());
                this._warheadExplosionCallback?.(warhead);
            }
        }

        this.RebuildMissileBoundingSphere();
        if (exploded) this._NotifyFinishedIfRequired();
    }

    _NotifyFinishedIfRequired()
    {
        if (this._finishedNotified) return;
        for (let i = 0; i < this.warheads.length; i++)
        {
            const state = this.warheads[i]?.GetState();
            if (state !== EveMissileWarhead.State.STATE_EXPLODED && state !== EveMissileWarhead.State.STATE_DEAD) return;
        }
        this._finishedNotified = true;
        this._missileFinishedCallback?.(this);
    }

    RebuildMissileBoundingSphere()
    {
        const g = EveMissile.global;
        vec4.set(g.mergedSphere, 0, 0, 0, 0);
        let found = false;
        for (let i = 0; i < this.warheads.length; i++)
        {
            if (!this.warheads[i]?.GetLocalBoundingSphere(g.warheadSphere)) continue;
            if (!found)
            {
                vec4.copy(g.mergedSphere, g.warheadSphere);
                found = true;
            }
            else
            {
                sph3.union(g.mergedSphere, g.mergedSphere, g.warheadSphere);
            }
        }
        vec3.set(this.boundingSphereCenter, g.mergedSphere[0], g.mergedSphere[1], g.mergedSphere[2]);
        this.boundingSphereRadius = g.mergedSphere[3];
        return found;
    }

    /**
     * Gets the missile's current world transform
     * @param {mat4} out
     * @returns {mat4}
     */
    GetWorldTransform(out)
    {
        return mat4.copy(out, this._worldTransform);
    }

    /**
     * Gets the missile's current world translation
     *
     * EveSpaceScene requires this method for distance-sorted raw objects.
     * @param {vec3} out
     * @returns {vec3}
     */
    GetWorldTranslation(out)
    {
        return mat4.getTranslation(out, this._worldTransform);
    }

    GetBoundingSphere(out = vec4.create())
    {
        vec4.set(out, this.boundingSphereCenter[0], this.boundingSphereCenter[1], this.boundingSphereCenter[2], this.boundingSphereRadius);
        sph3.transformMat4(out, out, this._worldTransform);
        return out;
    }

    GetBatches(mode, accumulator)
    {
        if (!this.display) return false;
        const count = accumulator.length;
        for (let i = 0; i < this.warheads.length; i++) this.warheads[i]?.GetBatches(mode, accumulator);
        return accumulator.length !== count;
    }

    static global = {
        zero: vec3.create(),
        identityRotation: quat.create(),
        inverseRotationQuat: quat.create(),
        inverseBallRotation: mat4.create(),
        targetPosition: vec3.create(),
        locatorPosition: vec3.create(),
        locatorOffset: vec3.create(),
        locatorTransform: mat4.create(),
        positionLast: vec3.create(),
        modelTranslation: vec3.create(),
        warheadSphere: vec4.create(),
        mergedSphere: vec4.create()
    };

}


function clamp01(value)
{
    return Math.max(0, Math.min(1, Number(value) || 0));
}


function transformNormal(out, vector, matrix)
{
    const x = vector?.[0] ?? 0;
    const y = vector?.[1] ?? 0;
    const z = vector?.[2] ?? 0;
    out[0] = matrix[0] * x + matrix[4] * y + matrix[8] * z;
    out[1] = matrix[1] * x + matrix[5] * y + matrix[9] * z;
    out[2] = matrix[2] * x + matrix[6] * y + matrix[10] * z;
    return out;
}


function enableEmitter(emitter, enable)
{
    if (typeof emitter?.Enable === "function") emitter.Enable(!!enable);
    else if (typeof emitter?.SetEnabled === "function") emitter.SetEnabled(!!enable);
    else if (emitter) emitter.enabled = !!enable;
}


function sampleCurve(curve, time, out, fallback)
{
    const value = curve?.GetValueAt?.(time, out) ?? curve?.Update?.(time, out);
    if (value?.length >= out.length && value !== out) out.set(value);
    else if (value === undefined && !curve?.GetValueAt && !curve?.Update) out.set(fallback);
    return out;
}


function resolveTargetPosition(target, out)
{
    if (!target)
    {
        vec3.set(out, 0, 0, 0);
        return false;
    }

    if (getDamageLocatorPosition(target, out, -1, true)) return true;
    if (typeof target.GetWorldTranslation === "function")
    {
        target.GetWorldTranslation(out);
        return true;
    }
    if (typeof target.GetWorldTransform === "function")
    {
        target.GetWorldTransform(EveMissile.global.locatorTransform);
        mat4.getTranslation(out, EveMissile.global.locatorTransform);
        return true;
    }
    const value = target.worldPosition ?? target.position;
    if (value?.length >= 3)
    {
        vec3.copy(out, value);
        return true;
    }
    return false;
}


function getDamageLocatorPosition(target, out, locator, worldSpace)
{
    if (typeof target?.GetDamageLocatorPosition !== "function") return false;
    const value = target.GetDamageLocatorPosition(out, locator, worldSpace);
    if (value?.length >= 3 && value !== out) vec3.copy(out, value);
    return value !== false;
}


function callCallback(callback, value)
{
    if (typeof callback === "function") callback(value);
    else callback?.CallVoid?.(value);
}
