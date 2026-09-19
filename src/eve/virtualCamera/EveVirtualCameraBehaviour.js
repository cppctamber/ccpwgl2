import { meta } from "utils";
import { vec3, quat, noise } from "math";
import { Tr2CurveScalar } from "curve/curve/Tr2CurveScalar";
import { Tr2CurveExtrapolation } from "curve/curve/Tr2CurveMath";

function curve(keys, name)
{
    const result = new Tr2CurveScalar();
    result.name = name;
    result.SetExtrapolation(Tr2CurveExtrapolation.LINEAR);
    for (const [ time, value ] of keys) result.AddKey(time, value);
    return result;
}
const constant = name => curve([ [ 0, 1 ], [ 1, 1 ] ], name);
const ease = name => curve([ [ 0, 0 ], [ 1, 1 ] ], name);
const envelope = () => curve([ [ 0, 0 ], [ 0.001, 0.8 ], [ 0.1, 1 ], [ 1, 0 ] ], "Shake - Magnitude Curve");
let nextPhase = 0;
const phase = () => nextPhase++ & 0xfff;
const sample = (time, frequency, octaves) => noise.carbonPerlin1D(time * frequency, 2, 2, octaves);

function rotateWithAnchor(value, forward)
{
    // Equivalent horizontal yaw; handles Carbon's zero cross-axis at +/-Z.
    return vec3.transformQuat(value, value, quat.setAxisAngle(quat.create(), [ 0, 1, 0 ], Math.atan2(forward[0], forward[2])));
}

class CameraBehaviour extends meta.Model
{
    @meta.string name = "";
    @meta.boolean active = true;
    GetName() { return this.name; }
    IsActive() { return this.active; }
    SetName(name)
    {
        this.name = name;
        for (const [ field, suffix ] of [ [ "scaleCurve", "Scale Curve" ], [ "magnitudeCurve", "Magnitude Curve" ],
            [ "interpolationCurve", "Interpolation Curve" ], [ "distanceScalarCurve", "Distance Scalar Curve" ], [ "orbitCurve", "Orbit Curve" ] ])
        {
            if (this[field]) this[field].name = `${name} - ${suffix}`;
        }
    }
    Initialize() { this.SetName(this.name); }
    OnValueChanged() { this.SetName(this.name); }
    Update() { throw new Error("Abstract camera behaviour"); }
}

@meta.define("EveVirtualCameraBehaviourFloatBase", true)
export class EveVirtualCameraBehaviourFloatBase extends CameraBehaviour {}

@meta.define("EveVirtualCameraBehaviourVector3Base", true)
export class EveVirtualCameraBehaviourVector3Base extends CameraBehaviour {}

@meta.define("EveVirtualCameraBehaviourFloatSet", true)
export class EveVirtualCameraBehaviourFloatSet extends EveVirtualCameraBehaviourFloatBase
{
    name = "Set";
    @meta.float value = 0;
    Update(camera, current) { return this.value - current; }
}

@meta.define("EveVirtualCameraBehaviourFloatAdd", true)
export class EveVirtualCameraBehaviourFloatAdd extends EveVirtualCameraBehaviourFloatBase
{
    name = "Add";
    @meta.float value = 0;
    @meta.struct() scaleCurve = constant("Add - Scale Curve");
    Update(camera, current, dt, time)
    {
        return this.value * (this.scaleCurve ? this.scaleCurve.GetValue(time / camera.GetAnimationTimelineLength()) : 1);
    }
}

@meta.define("EveVirtualCameraBehaviourFloatNoise", true)
export class EveVirtualCameraBehaviourFloatNoise extends EveVirtualCameraBehaviourFloatBase
{
    name = "Shake";
    @meta.float perlineScale = 1;
    @meta.uint octaves = 8;
    @meta.float magnitude = 1;
    @meta.struct() magnitudeCurve = envelope();
    _phase = phase();
    Update(camera, current, dt, time)
    {
        let offset = this.magnitude * sample(time + this._phase, this.perlineScale, this.octaves);
        if (this.magnitudeCurve) offset *= this.magnitudeCurve.GetValue(time / camera.GetAnimationTimelineLength());
        return offset;
    }
}

@meta.define("EveVirtualCameraBehaviourFloatDamping", true)
export class EveVirtualCameraBehaviourFloatDamping extends EveVirtualCameraBehaviourFloatBase
{
    name = "Damping";
    @meta.float dampingFactor = 1;
    _lastValue = 0;
    Update(camera, current, dt, time)
    {
        if (time <= 0) { this._lastValue = current; return 0; }
        this._lastValue += (current - this._lastValue) * this.dampingFactor;
        return this._lastValue - current;
    }
}

@meta.define("EveVirtualCameraBehaviourVector3MoveBetween", true)
export class EveVirtualCameraBehaviourVector3MoveBetween extends EveVirtualCameraBehaviourVector3Base
{
    name = "Move Between";
    @meta.vector3 start = vec3.create();
    @meta.vector3 end = vec3.create();
    @meta.struct() interpolationCurve = ease("Move Between - Interpolation Curve");
    @meta.boolean proportional = false;
    @meta.boolean world = true;
    Update(camera, current, dt, time, anchor, radius, forward)
    {
        const start = vec3.clone(this.start), end = vec3.clone(this.end);
        if (this.proportional) { vec3.scale(start, start, radius); vec3.scale(end, end, radius); }
        if (!this.world) { rotateWithAnchor(start, forward); rotateWithAnchor(end, forward); }
        const duration = camera.GetAnimationTimelineLength();
        if (duration === 0) return vec3.clone(this.end);
        return vec3.lerp(start, start, end, this.interpolationCurve ? this.interpolationCurve.GetValue(time / duration) : time / duration);
    }
}

@meta.define("EveVirtualCameraBehaviourVector3Offset", true)
export class EveVirtualCameraBehaviourVector3Offset extends EveVirtualCameraBehaviourVector3Base
{
    name = "Offset";
    @meta.vector3 offset = vec3.create();
    @meta.boolean proportional = true;
    @meta.boolean world = false;
    Update(camera, current, dt, time, anchor, radius, forward)
    {
        const result = vec3.clone(this.offset);
        if (!this.world) rotateWithAnchor(result, forward);
        return this.proportional ? vec3.scale(result, result, radius) : result;
    }
}

@meta.define("EveVirtualCameraBehaviourVector3Orbit", true)
export class EveVirtualCameraBehaviourVector3Orbit extends EveVirtualCameraBehaviourVector3Base
{
    name = "Orbit";
    @meta.float start = 0;
    @meta.float end = 180;
    @meta.float distance = 1;
    @meta.struct() distanceScalarCurve = constant("Orbit - Distance Scalar Curve");
    @meta.struct() orbitCurve = ease("Orbit - Orbit Curve");
    @meta.boolean proportional = true;
    @meta.boolean world = false;
    Update(camera, current, dt, time, anchor, radius, forward)
    {
        const direction = this.world ? vec3.fromValues(0, 0, 1) : vec3.fromValues(forward[0], 0, forward[2]);
        vec3.normalize(direction, direction);
        const t = time / camera.GetAnimationTimelineLength();
        const angle = this.start + (this.end - this.start) * (this.orbitCurve ? this.orbitCurve.GetValue(t) : t);
        vec3.transformQuat(direction, direction, quat.setAxisAngle(quat.create(), [ 0, 1, 0 ], angle * Math.PI / 180));
        let range = this.distance;
        if (this.proportional) range *= radius;
        if (this.distanceScalarCurve) range *= this.distanceScalarCurve.GetValue(t);
        return vec3.scale(direction, direction, range);
    }
}

@meta.define("EveVirtualCameraBehaviourVector3MoveForward", true)
export class EveVirtualCameraBehaviourVector3MoveForward extends EveVirtualCameraBehaviourVector3Base
{
    name = "Move Forward";
    @meta.float value = 0;
    @meta.struct() scaleCurve = constant("Move Forward - Scale Curve");
    @meta.boolean proportional = true;
    GetCurrentValue(camera, time, radius)
    {
        let value = this.value;
        if (this.scaleCurve) value *= this.scaleCurve.GetValue(time / camera.GetAnimationTimelineLength());
        if (this.proportional) value *= radius;
        return value;
    }
    Update(camera, current, dt, time, anchor, radius)
    {
        return vec3.scale(vec3.create(), camera.GetForwardDirection(), this.GetCurrentValue(camera, time, radius));
    }
}

@meta.define("EveVirtualCameraBehaviourVector3MoveRight", true)
export class EveVirtualCameraBehaviourVector3MoveRight extends EveVirtualCameraBehaviourVector3MoveForward
{
    name = "Move Right";
    scaleCurve = constant("Move Right - Scale Curve");
    Update(camera, current, dt, time, anchor, radius)
    {
        return vec3.scale(vec3.create(), camera.GetRightDirection(), this.GetCurrentValue(camera, time, radius));
    }
}

@meta.define("EveVirtualCameraBehaviourVector3MoveUp", true)
export class EveVirtualCameraBehaviourVector3MoveUp extends EveVirtualCameraBehaviourVector3MoveForward
{
    name = "Move Up";
    scaleCurve = constant("Move Up - Scale Curve");
    Update(camera, current, dt, time, anchor, radius)
    {
        return vec3.scale(vec3.create(), camera.GetUpDirection(), this.GetCurrentValue(camera, time, radius));
    }
}

@meta.define("EveVirtualCameraBehaviourVector3Shake", true)
export class EveVirtualCameraBehaviourVector3Shake extends EveVirtualCameraBehaviourVector3Base
{
    name = "Shake";
    @meta.float perlineScale = 1;
    @meta.uint octaves = 8;
    @meta.vector3 magnitude = vec3.fromValues(1, 0.6, 0.2);
    @meta.struct() magnitudeCurve = envelope();
    @meta.boolean scaleByView = true;
    _phase = phase();
    Update(camera, current, dt, time)
    {
        const offset = vec3.clone(this.magnitude), phases = [ 1.1, 10.1, 18.3 ];
        for (let i = 0; i < 3; i++) offset[i] *= sample(time + this._phase + phases[i], this.perlineScale, this.octaves);
        if (this.magnitudeCurve) vec3.scale(offset, offset, this.magnitudeCurve.GetValue(time / camera.GetAnimationTimelineLength()));
        if (this.scaleByView)
        {
            const distance = vec3.distance(camera.GetPointOfInterest(), camera.GetPosition());
            for (let i = 0; i < 3; i++) offset[i] = Math.atan(offset[i]) * distance;
        }
        const result = vec3.scale(vec3.create(), camera.GetRightDirection(), offset[0]);
        vec3.scaleAndAdd(result, result, camera.GetUpDirection(), offset[1]);
        return vec3.scaleAndAdd(result, result, camera.GetForwardDirection(), offset[2]);
    }
}

@meta.define("EveVirtualCameraBehaviourVector3Damping", true)
export class EveVirtualCameraBehaviourVector3Damping extends EveVirtualCameraBehaviourVector3Base
{
    name = "Damping";
    // This spelling is the native Blue attribute, unlike the float behaviour.
    @meta.float m_dampingRatio = 1;
    _lastPosition = vec3.create();
    Update(camera, current, dt, time)
    {
        if (time <= 0) { vec3.copy(this._lastPosition, current); return vec3.create(); }
        vec3.lerp(this._lastPosition, this._lastPosition, current, this.m_dampingRatio);
        return vec3.subtract(vec3.create(), this._lastPosition, current);
    }
}

@meta.define("EveVirtualCameraBehaviourVector3Inertia", true)
export class EveVirtualCameraBehaviourVector3Inertia extends EveVirtualCameraBehaviourVector3Base
{
    name = "Inertia";
    @meta.float inertiaFactor = 1;
    _lastPosition = vec3.create();
    _lastVelocity = vec3.create();
    Update(camera, current, dt, time)
    {
        if (time <= 0)
        {
            vec3.set(this._lastVelocity, 0, 0, 0);
            vec3.copy(this._lastPosition, current);
            return vec3.create();
        }
        const velocity = vec3.subtract(vec3.create(), current, this._lastPosition);
        vec3.lerp(velocity, this._lastVelocity, velocity, 1 / this.inertiaFactor);
        vec3.add(this._lastPosition, this._lastPosition, velocity);
        vec3.scale(this._lastVelocity, velocity, dt);
        return vec3.subtract(vec3.create(), this._lastPosition, current);
    }
}
