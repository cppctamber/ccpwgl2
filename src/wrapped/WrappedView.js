// WrappedView.js
import { vec4, mat4 } from "math";

export class WrappedView
{
    camera = null;
    scene = null;
    viewport = vec4.create();

    environment = false;
    clearColor = null;

    constructor(scene=null, camera=null, viewPort=[ 0,0,0,0 ])
    {
        this.camera = camera;
        this.scene = scene;
        vec4.copy(this.viewport, viewPort);
    }

    Update(dt)
    {
        if (this.camera) this.camera.Update(dt);
    }

    GetNearPlane()
    {
        return this.camera.GetNearPlane();
    }
    GetFarPlane()
    {
        return this.camera.GetFarPlane();
    }

    GetView(out)
    {
        return this.camera ? this.camera.GetView(out) : mat4.identity(out);
    }

    GetProjection(out, aspect)
    {
        return this.camera ? this.camera.GetProjection(out, aspect) : mat4.identity(out);
    }
}
