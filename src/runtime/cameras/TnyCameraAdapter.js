import { meta } from "utils";
import { mat4 } from "math";
import { TriView } from "core/view/TriView";
import { TriProjection } from "core/view/TriProjection";

/** Bridges native Carbon view/projection APIs to CCPWGL's two-method camera contract. */
@meta.define("TnyCameraAdapter", true)
export class TnyCameraAdapter extends meta.Model
{
    @meta.struct() view = new TriView();
    @meta.struct("TriProjection") projection = null;
    @meta.float frontClip = 10;
    @meta.float backClip = 10000000;
    @meta.boolean autoUpdate = true;
    _time = 0;

    _GetCamera()
    {
        return this.view.GetCurrentCamera ? this.view.GetCurrentCamera() : this.view;
    }

    GetView(out = mat4.create())
    {
        const camera = this._GetCamera();
        if (camera.GetView) return camera.GetView(out);
        const view = camera.GetViewMatrix ? camera.GetViewMatrix() : camera;
        return mat4.copy(out, view.GetTransform ? view.GetTransform() : view);
    }

    GetProjection(out = mat4.create(), aspect = 1)
    {
        if (this.projection) return this.projection.GetTransform(out);
        const camera = this._GetCamera();
        if (camera.GetProjection) return camera.GetProjection(out, aspect);
        if (camera.GetProjectionMatrix) return camera.GetProjectionMatrix(aspect, this.frontClip, this.backClip, out);
        throw new Error("A TriView camera requires a TriProjection");
    }

    Update(dt)
    {
        if (!this.autoUpdate) return;
        this._time += dt;
        if (this.view.Update) this.view.Update(this.view.GetCurrentCamera ? this._time : dt);
    }

    GetNearPlane()
    {
        if (this.projection && this.projection.GetProjectionType() !== TriProjection.CUSTOM) return this.projection._zn;
        const camera = this._GetCamera();
        return !this.projection && camera.GetNearPlane ? camera.GetNearPlane() : this.frontClip;
    }

    GetFarPlane()
    {
        if (this.projection && this.projection.GetProjectionType() !== TriProjection.CUSTOM) return this.projection._zf;
        const camera = this._GetCamera();
        return !this.projection && camera.GetFarPlane ? camera.GetFarPlane() : this.backClip;
    }
}
