import { meta } from "utils";
import { mat4, quat, vec3 } from "math";
import { TriView } from "core/view/TriView";
import { TriProjection } from "core/view/TriProjection";
import { Tr2CurveScalar } from "curve/curve/Tr2CurveScalar";
import { Tr2CurveInterpolation, Tr2CurveTangentType } from "curve/curve/Tr2CurveMath";

const TWO_PI = 2 * Math.PI;
const finiteVector = v => Number.isFinite(v[0]) && Number.isFinite(v[1]) && Number.isFinite(v[2]);
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// Carbon's spring targets are named "speed", but contain accumulated angles.
function approach(value, target, friction, dt)
{
    value = (value + friction * dt * target) / (1 + friction * dt);
    return Math.abs(value - target) < 0.0001 ? target : value;
}

function accumulate(value, delta, min, max)
{
    const old = value;
    value += delta;
    if (value > max && value - old < 0) value = max;
    else if (value < min && old - value < 0) value = min;
    return value;
}

/**
 * Target camera with independent orbit and interest rotations.
 * Angles and fieldOfView are radians; translationFromParent is a distance.
 * GetView/GetProjection are the camera interface. Input is deliberately external.
 * Update accepts delta seconds, plus optional absolute curve time in seconds.
 */
@meta.define("EveCamera", true)
export class EveCamera extends meta.Model
{
    @meta.struct() parent = null;
    @meta.struct() interest = null;
    @meta.struct() audio2Listener = null;
    @meta.struct() errorHandler = null;
    @meta.float translationFromParent = 20;
    @meta.quaternion rotationAroundParent = quat.create();
    @meta.quaternion rotationOfInterest = quat.create();
    @meta.vector3 alignment = vec3.fromValues(0, 1, 0);
    @meta.vector3 extraTranslation = vec3.create();
    @meta.boolean useExtraTranslation = false;
    @meta.float fieldOfView = Math.PI / 2;
    @meta.float frontClip = 10;
    @meta.float backClip = 10000000;
    @meta.float friction = 7;
    @meta.float maxSpeed = 0.05;
    @meta.float minPitch = -1.4;
    @meta.float maxPitch = 1.4;
    @meta.float minYaw = 0;
    @meta.float maxYaw = 0;
    @meta.float yaw = 0;
    @meta.float pitch = 0;
    @meta.boolean idleMove = false;
    @meta.float idleScale = 2;
    @meta.float idleSpeed = 0.8;
    @meta.boolean noise = false;
    @meta.float noiseScale = 1;
    @meta.float noiseDamp = 1.1;
    @meta.float centerOffset = 0;
    @meta.struct() zoomCurve = EveCamera.CreateZoomCurve();
    @meta.boolean enableFovAnimation = true;
    @meta.struct() noiseCurve = null;
    @meta.struct() noiseScaleCurve = null;
    @meta.struct() noiseDampCurve = null;
    @meta.boolean update = true;
    @meta.vector3 pos = vec3.create();
    @meta.vector3 intr = vec3.create();

    viewVec = vec3.create();
    rightVec = vec3.create();
    upVec = vec3.create();
    viewMatrix = new TriView();
    projectionMatrix = new TriProjection();
    _projectionTransform = mat4.create();

    _yawSpeed = 0;
    _pitchSpeed = 0;
    _yawInt = 0;
    _pitchInt = 0;
    _yawIntSpeed = 0;
    _pitchIntSpeed = 0;
    _zoomKey = 0;
    _zoomTime = 0;
    _idleTheta = 0;
    _noiseX = 0;
    _noiseY = 0;
    _maxNoise = 80;
    _time = 0;
    _start = null;
    _aspect = 1;
    _failedLastFrame = false;
    _lastRotation = quat.create();
    _lastInterest = null;
    _trackInterest = false;
    _parentPosition = vec3.create();
    _toInterest = vec3.create();
    _side = vec3.create();
    _up = vec3.create();
    _realUp = vec3.create();
    _target = vec3.create();
    _rotation = quat.create();
    _view = mat4.create();
    _interestView = mat4.create();

    constructor(values)
    {
        super();
        if (values)
        {
            this.SetValues(values);
            this.Initialize();
        }
    }

    Initialize()
    {
        this.OnValueChanged();
        this.Update(0);
    }

    OnValueChanged()
    {
        this._SynchronizeAttributes();
    }

    _SynchronizeAttributes()
    {
        // JS permits in-place quaternion writes. Compare the last generated
        // value to reproduce Carbon's NOTIFY hook without requiring a setter.
        const q = this.rotationAroundParent;
        if (!quat.exactEquals(q, this._lastRotation))
        {
            const y = clamp(2 * (q[0] * q[3] - q[2] * q[1]), -1, 1);
            this.pitch = Math.asin(y);
            this.yaw = Math.abs(Math.abs(y) - 1) < 0.00001 ? 0 :
                Math.atan2(2 * (q[0] * q[2] + q[1] * q[3]), 1 - 2 * (q[0] * q[0] + q[1] * q[1]));
            quat.copy(this._lastRotation, q);
        }
        if (this.interest !== this._lastInterest)
        {
            this._trackInterest = !!this.interest && this.interest !== this.parent;
            if (!this._trackInterest) this._yawIntSpeed = this._pitchIntSpeed = 0;
            this._lastInterest = this.interest;
        }
    }

    OrbitParent(horizontal, vertical)
    {
        this._yawSpeed = this.minYaw !== this.maxYaw ?
            accumulate(this._yawSpeed, this.maxSpeed * horizontal, this.minYaw, this.maxYaw) :
            this._yawSpeed + this.maxSpeed * horizontal;
        this._pitchSpeed = accumulate(this._pitchSpeed, -this.maxSpeed * vertical, this.minPitch, this.maxPitch);
    }

    SetOrbit(yaw, pitch)
    {
        this.yaw = this._yawSpeed = yaw % TWO_PI;
        this.pitch = this._pitchSpeed = pitch;
    }

    RotateOnOrbit(horizontal, vertical)
    {
        this._yawIntSpeed = this.minYaw !== this.maxYaw ?
            accumulate(this._yawIntSpeed, this.maxSpeed * horizontal, this.minYaw, this.maxYaw) :
            this._yawIntSpeed + this.maxSpeed * horizontal;
        this._pitchIntSpeed = accumulate(this._pitchIntSpeed, -this.maxSpeed * vertical, this.minPitch, this.maxPitch);
        quat.fromYawPitchRoll(this.rotationOfInterest, this._yawInt, this._pitchInt, 0);
    }

    SetRotationOnOrbit(yaw, pitch)
    {
        this._yawInt = this._yawIntSpeed = yaw;
        this._pitchInt = this._pitchIntSpeed = pitch;
        quat.fromYawPitchRoll(this.rotationOfInterest, yaw, pitch, 0);
    }

    Dolly(factor)
    {
        this.translationFromParent += factor;
    }

    Zoom(key = -1)
    {
        if (!this.enableFovAnimation) return false;
        const keys = this.zoomCurve && this.zoomCurve.keys;
        if (!keys || !keys.length) return false;
        if (!Number.isInteger(key) || key < -1) return false;
        this._zoomKey = key === -1 ? this._zoomKey + 1 : key;
        if (this._zoomKey >= keys.length - 1) this._zoomKey = 0;
        this._zoomTime = keys[this._zoomKey].time;
        return true;
    }

    ResetStartTime()
    {
        this._start = null;
    }

    GetView(out = mat4.create())
    {
        return mat4.copy(out, this.viewMatrix.transform);
    }

    GetProjection(out = mat4.create(), aspect = this._aspect)
    {
        this._aspect = aspect;
        EveCamera.CalculateProjectionMatrix(this._projectionTransform, aspect, this.fieldOfView,
            this.centerOffset, 0, this.frontClip, this.backClip);
        this.projectionMatrix.CustomProjection(this._projectionTransform);
        return mat4.copy(out, this._projectionTransform);
    }

    /** Carbon name retained for consumers using its API. */
    GetViewMatrix()
    {
        return this.viewMatrix;
    }

    GetPosition()
    {
        return this.pos;
    }

    // Optional runtime hooks; neither is part of camera detection.
    GetNearPlane()
    {
        return this.frontClip;
    }

    GetFarPlane()
    {
        return this.backClip;
    }

    /**
     * Carbon samples curves at t and springs at real-time dT. The host supplies
     * dT here; an explicit time allows scene time and motion time to differ.
     */
    Update(dt, time = this._time + dt)
    {
        if (!this.update) return false;
        if (!Number.isFinite(dt) || dt < 0 || !Number.isFinite(time))
        {
            throw new RangeError("EveCamera.Update requires finite time and nonnegative delta seconds");
        }
        this._SynchronizeAttributes();
        this._time = time;
        if (this._start === null) this._start = time;
        let failed = false;
        const parent = this._parentPosition;
        vec3.set(parent, 0, 0, 0);
        if (this.parent) this.parent.GetValueAt(time, parent);
        if (this.useExtraTranslation) vec3.add(parent, parent, this.extraTranslation);

        this.translationFromParent = Math.max(this.translationFromParent, Math.max(1, this.frontClip));
        if (!Number.isFinite(this.translationFromParent))
        {
            this.translationFromParent = 1;
            failed = true;
        }

        this._UpdateFovAnimation(dt);

        this.yaw = approach(this.yaw, this._yawSpeed, this.friction, dt);
        this.pitch = approach(this.pitch, this._pitchSpeed, this.friction, dt);
        this.pitch = clamp(this.pitch, this.minPitch, this.maxPitch);
        if (this.minYaw !== this.maxYaw) this.yaw = clamp(this.yaw, this.minYaw, this.maxYaw);
        quat.fromYawPitchRoll(this.rotationAroundParent, this.yaw, this.pitch, 0);
        quat.copy(this._lastRotation, this.rotationAroundParent);
        vec3.set(this.pos, 0, 0, this.translationFromParent);
        vec3.transformQuat(this.pos, this.pos, this.rotationAroundParent);
        vec3.add(this.pos, this.pos, parent);

        this._idleTheta += dt * this.idleSpeed;
        if (this._idleTheta > TWO_PI) this._idleTheta %= TWO_PI;
        let idleYaw = 0, idlePitch = 0;
        if (this.idleMove)
        {
            idleYaw = this.idleScale * Math.cos(this._idleTheta);
            idlePitch = 1.2 * idleYaw * Math.sin(this._idleTheta);
        }
        const localTime = time - this._start;
        this.noise = this.noiseCurve ? this.noiseCurve.Update(localTime) > 0 : false;
        if (this.noise)
        {
            if (this.noiseScaleCurve)
            {
                const scale = this.noiseScaleCurve.Update(localTime);
                if (Number.isFinite(scale)) this.noiseScale = scale;
            }
            if (this.noiseDampCurve)
            {
                const damp = this.noiseDampCurve.Update(localTime);
                if (Number.isFinite(damp)) this.noiseDamp = damp;
            }
            this._noiseX = clamp((this._noiseX + this.noiseDamp * (Math.random() - 0.5)) /
                (1 + this.noiseDamp * dt), -this._maxNoise, this._maxNoise);
            this._noiseY = clamp((this._noiseY + this.noiseDamp * (Math.random() - 0.5)) /
                (1 + this.noiseDamp * dt), -this._maxNoise, this._maxNoise);
            idleYaw += this.noiseScale * this._noiseX;
            idlePitch += this.noiseScale * this._noiseY;
        }

        const forward = this._toInterest, side = this._side, up = this._up;
        vec3.subtract(forward, parent, this.pos);
        vec3.normalize(forward, forward);
        vec3.set(up, 0, 1, 0);
        vec3.cross(side, forward, up);
        vec3.cross(up, side, forward);
        // Carbon uses a 100-unit ray, without normalizing its side/up basis.
        vec3.scaleAndAdd(this.intr, this.pos, forward, 100);
        vec3.scaleAndAdd(this.intr, this.intr, side, idleYaw);
        vec3.scaleAndAdd(this.intr, this.intr, up, idlePitch);

        this._yawInt = approach(this._yawInt, this._yawIntSpeed, this.friction, dt);
        this._pitchInt = approach(this._pitchInt, this._pitchIntSpeed, this.friction, dt);
        if (this._trackInterest && this.interest)
        {
            this.interest.GetValueAt(time, this._target);
            vec3.subtract(this._target, this._target, this.pos);
            const x = vec3.dot(this._target, side), y = vec3.dot(this._target, up),
                z = vec3.dot(this._target, forward), r = Math.hypot(x, y, z);
            this._yawIntSpeed = -Math.atan2(x, z);
            this._pitchIntSpeed = r > 0 ? Math.asin(y / r) : 0;
        }
        else if (this.rotationOfInterest[0] === 0 && this.rotationOfInterest[1] === 0 &&
            this.rotationOfInterest[2] === 0 && this.rotationOfInterest[3] === 1)
        {
            this._yawIntSpeed = this._pitchIntSpeed = 0;
        }
        this._pitchInt = clamp(this._pitchInt, this.minPitch, this.maxPitch);
        if (this.minYaw !== this.maxYaw)
        {
            if (this._yawInt > this.maxYaw) this._yawInt = this.maxYaw;
            // Preserve the source's lower-limit comparison against orbit yaw.
            else if (this.yaw < this.minYaw) this._yawInt = this.minYaw;
        }
        quat.fromYawPitchRoll(this.rotationOfInterest, this._yawInt, this._pitchInt, 0);

        vec3.transformQuat(this._realUp, this.alignment, this.rotationAroundParent);
        vec3.normalize(this._realUp, this._realUp);
        if (!finiteVector(this._realUp) || !vec3.squaredLength(this._realUp))
        {
            vec3.set(this._realUp, 0, 1, 0);
            failed = true;
        }
        if (vec3.squaredDistance(this.pos, this.intr) === 0)
        {
            this.pos[2] += this.translationFromParent;
            failed = true;
        }
        if (!finiteVector(this.pos) || !finiteVector(this.intr))
        {
            vec3.set(this.intr, 0, 0, 0);
            vec3.set(this.pos, 0, 0, this.translationFromParent);
            failed = true;
        }
        mat4.lookAt(this._view, this.pos, this.intr, this._realUp);
        quat.invert(this._rotation, this.rotationOfInterest);
        mat4.fromQuat(this._interestView, this._rotation);
        // Carbon: view * inverse(interestRotation); GL reverses composition.
        mat4.multiply(this.viewMatrix.transform, this._interestView, this._view);
        this._CacheBasis();
        if (!finiteVector(this.viewVec) || !finiteVector(this.upVec) || !finiteVector(this.rightVec) ||
            !vec3.squaredLength(this.viewVec) || !vec3.squaredLength(this.upVec) || !vec3.squaredLength(this.rightVec))
        {
            mat4.copy(this.viewMatrix.transform, this._view);
            this._CacheBasis();
            failed = true;
        }
        this.GetProjection(this._projectionTransform);
        if (this.audio2Listener) this.audio2Listener.UpdatePlacement(this.viewVec, this.upVec, this.pos);
        if (failed && !this._failedLastFrame)
        {
            if (this.errorHandler) this.errorHandler.HandleEvent(null);
            this.EmitEvent("error", this);
        }
        this._failedLastFrame = failed;
        return true;
    }

    _UpdateFovAnimation(dt)
    {
        const keys = this.zoomCurve && this.zoomCurve.keys;
        if (this.enableFovAnimation && keys && keys.length && keys[keys.length - 1].time > 0 &&
            keys[this._zoomKey + 1] && this._zoomTime < keys[this._zoomKey + 1].time)
        {
            this._zoomTime = Math.min(this._zoomTime + dt, keys[this._zoomKey + 1].time);
            this.fieldOfView = this.zoomCurve.Update(this._zoomTime);
        }
    }

    _CacheBasis()
    {
        const m = this.viewMatrix.transform;
        vec3.set(this.viewVec, m[2], m[6], m[10]);
        vec3.set(this.upVec, m[1], m[5], m[9]);
        vec3.set(this.rightVec, m[0], m[4], m[8]);
    }

    static CreateZoomCurve()
    {
        const curve = new Tr2CurveScalar();
        const interpolation = Tr2CurveInterpolation.HERMITE, tangent = Tr2CurveTangentType.FREE_SPLIT;
        curve.AddKey(0, Math.PI / 2, interpolation, 0, -11, tangent);
        curve.AddKey(0.225, 0.8, interpolation, 0, -9, tangent);
        curve.AddKey(0.45, 0.1, interpolation, 0, 20, tangent);
        curve.AddKey(0.675, Math.PI / 2, interpolation, 0, 0, tangent);
        return curve;
    }

    /** Carbon right-handed projection, depth 0..1, aspect correction above 1.6. */
    static CalculateProjectionMatrix(out, aspect, fov, offsetX, offsetY, front, back)
    {
        if (!aspect || !Number.isFinite(aspect)) aspect = 1;
        if (!fov || !Number.isFinite(fov)) fov = 1;
        let dx = aspect * front * Math.tan(fov / 2), dy = front * Math.tan(fov / 2);
        if (aspect > 1.6)
        {
            const adjustment = aspect / 1.6;
            dx /= adjustment;
            dy /= adjustment;
        }
        return mat4.carbonPerspectiveOffCenter(out, -dx + dx * offsetX, dx + dx * offsetX,
            -dy + dy * offsetY, dy + dy * offsetY, front, back);
    }

    static CalculateFovFromProjection(projection)
    {
        const aspect = projection[0] ? projection[5] / projection[0] : 0;
        return 2 * Math.atan((aspect > 1.6 ? aspect / 1.6 : 1) / projection[5]);
    }

    static ModifyClipPlanes(original, near, far, out = mat4.create())
    {
        const aspect = original[0] ? original[5] / original[0] : 0;
        return EveCamera.CalculateProjectionMatrix(out, aspect, EveCamera.CalculateFovFromProjection(original),
            original[8], original[9], near, far);
    }

    static AddCenterOffset(original, x, y, near, far, out = mat4.create())
    {
        const aspect = original[0] ? original[5] / original[0] : 0;
        return EveCamera.CalculateProjectionMatrix(out, aspect, EveCamera.CalculateFovFromProjection(original),
            original[8] + x, original[9] + y, near, far);
    }
}
