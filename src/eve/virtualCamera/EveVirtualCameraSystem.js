import { meta } from "utils";
import { EveVirtualCamera } from "./EveVirtualCamera";
import { EveVirtualCameraTransitionCut, EveVirtualCameraTransitionLerp } from "./EveVirtualCameraTransition";

@meta.define("EveVirtualCameraSystem", true)
export class EveVirtualCameraSystem extends meta.Model
{
    @meta.list("EveVirtualCamera") cameras = [];
    @meta.struct("EveVirtualCamera") externalCamera = new EveVirtualCamera();
    @meta.struct("EveVirtualCamera") mainCamera = null;
    transition = null;
    _lastUpdate = 0;
    constructor()
    {
        super();
        this.externalCamera.SetName("externalCamera");
        this.externalCamera.SetAnimationTimelineLength(0);
        this.mainCamera = this.externalCamera;
    }
    Initialize() { return true; }
    GetMainCamera() { return this.mainCamera; }
    GetCurrentCamera() { return this.transition ? this.transition.GetCamera() : this.mainCamera; }
    IsExternallyControlled() { return this.GetCurrentCamera() === this.externalCamera; }
    AddCamera(camera)
    {
        if (camera === this.externalCamera || this.cameras.includes(camera)) return false;
        this.cameras.push(camera);
        return true;
    }
    GetCameraByName(name)
    {
        if (name === this.externalCamera.GetName()) return this.externalCamera;
        return this.cameras.find(camera => camera.GetName() === name) || null;
    }
    _SetMainCamera(camera, transition)
    {
        const source = this.mainCamera;
        this.transition = null;
        this.mainCamera = camera;
        this.AddCamera(camera);
        if (transition)
        {
            transition.SetSource(source);
            transition.SetTarget(camera);
            transition.Play();
        }
        this.transition = transition;
    }
    CutToCamera(camera)
    {
        if (camera && camera !== this.mainCamera) this._SetMainCamera(camera, new EveVirtualCameraTransitionCut());
    }
    LerpToCamera(camera, lerpTime = 1)
    {
        if (camera && camera !== this.mainCamera)
        {
            const transition = new EveVirtualCameraTransitionLerp();
            transition.SetTransitionTime(lerpTime);
            this._SetMainCamera(camera, transition);
        }
    }
    /** Native API takes absolute simulation time in seconds, not delta time. */
    Update(simTime)
    {
        if (this._lastUpdate === 0) this._lastUpdate = simTime;
        const dt = simTime - this._lastUpdate;
        this._lastUpdate = simTime;
        for (const camera of this.cameras) camera.Update(dt);
        if (this.externalCamera) this.externalCamera.Update(dt);
        if (this.transition)
        {
            this.transition.Update(dt);
            if (this.transition.IsComplete()) this.transition = null;
        }
    }
}
