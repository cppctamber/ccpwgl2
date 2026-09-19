import { meta } from "utils";
import { vec3 } from "math";
import { Tr2CurveScalar } from "curve/curve/Tr2CurveScalar";
import { EveVirtualCamera } from "./EveVirtualCamera";

@meta.define("EveVirtualCameraTransitionBase", true)
export class EveVirtualCameraTransitionBase extends meta.Model
{
    _sourceCamera = null;
    _targetCamera = null;
    _transitionCamera = null;
    IsComplete() { throw new Error("Abstract camera transition"); }
    GetCamera() { return this.IsComplete() ? this._targetCamera : this._transitionCamera; }
    SetSource(value) { this._sourceCamera = value; }
    SetTarget(value) { this._targetCamera = value; }
    Play()
    {
        this._transitionCamera = new EveVirtualCamera();
        this._transitionCamera.SetName("transitionCamera");
        if (this._sourceCamera) this._transitionCamera.CopyTransform(this._sourceCamera);
        if (this._targetCamera) this._targetCamera.Reset();
        this._transitionCamera.Play();
    }
    Stop()
    {
        if (this._targetCamera) this._targetCamera.Play();
        if (this._sourceCamera) this._sourceCamera.Pause();
        if (this._transitionCamera) this._transitionCamera.Pause();
    }
    Update(dt)
    {
        if (this._transitionCamera) this._transitionCamera.Update(dt);
        if (this.IsComplete()) this.Stop();
    }
}

@meta.define("EveVirtualCameraTransitionCut", true)
export class EveVirtualCameraTransitionCut extends EveVirtualCameraTransitionBase
{
    IsComplete() { return true; }
}

@meta.define("EveVirtualCameraTransitionLerp", true)
export class EveVirtualCameraTransitionLerp extends EveVirtualCameraTransitionBase
{
    // Misspelled in Carbon's Blue exposure; keep the serialized name.
    @meta.float tansitionTime = 1;
    _localTime = 0;
    _transitionCurve = new Tr2CurveScalar();
    constructor()
    {
        super();
        this._transitionCurve.AddKey(0, 0);
        this._transitionCurve.AddKey(1, 1);
    }
    GetTransitionTime() { return this.tansitionTime; }
    SetTransitionTime(value) { this.tansitionTime = value; }
    IsComplete() { return this._localTime > this.tansitionTime; }
    Play()
    {
        this._localTime = 0;
        super.Play();
        if (this._targetCamera)
        {
            this._targetCamera.UpdateToLocalTime(-this.tansitionTime);
            this._targetCamera.Play();
        }
    }
    Update(dt)
    {
        this._localTime += dt;
        const source = this._sourceCamera, target = this._targetCamera;
        if (this._transitionCamera && source && target)
        {
            let t = 1;
            if (this.tansitionTime > 0)
            {
                t = this._localTime / this.tansitionTime;
                if (this._transitionCurve) t = this._transitionCurve.GetValue(t);
                t = Math.max(0, Math.min(1, t));
            }
            this._transitionCamera.UpdateExternal(
                vec3.lerp(vec3.create(), source.GetPosition(), target.GetPosition(), t),
                vec3.lerp(vec3.create(), source.GetPointOfInterest(), target.GetPointOfInterest(), t),
                source.GetFov() + (target.GetFov() - source.GetFov()) * t,
                source.GetRoll() + (target.GetRoll() - source.GetRoll()) * t);
        }
        super.Update(dt);
    }
}
