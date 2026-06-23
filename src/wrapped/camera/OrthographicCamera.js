import { Camera } from "./Camera";
import { CameraView } from "./CameraView";
import { mat4, vec3 } from "math";
import { device } from "global/tw2";
import { meta } from "utils";

export class OrthographicCamera extends Camera
{

    @meta.float
    left = device.viewportWidth / -2;

    @meta.float
    right = device.viewportWidth / 2;

    @meta.float
    top = device.viewportHeight / -2;

    @meta.float
    bottom = device.viewportHeight / 2;

    @meta.float
    near = -4000;

    @meta.float
    far = 4000;

    @meta.float
    zoom = 1;

    get isOrthographicCamera()
    {
        return true;
    }

    GetNearPlane()
    {
        return this.near;
    }

    GetFarPlane()
    {
        return this.far;
    }

    /**
     * Fires when the world transform is modified
     * @param {mat4} world
     */
    OnWorldTransformModified(world)
    {
        let dx = (this.right - this.left) / (2 * this.zoom),
            dy = (this.top - this.bottom) / (2 * this.zoom),
            cx = (this.right + this.left) / 2,
            cy = (this.top + this.bottom) / 2;

        let left = cx - dx,
            right = cx + dx,
            top = cy + dy,
            bottom = cy - dy;

        const view = this.view;
        if (view && view.enabled)
        {
            let zoomW = this._zoom / (view.width / view.fullWidth);
            let zoomH = this._zoom / (view.height / view.fullHeight);
            let scaleW = (this.right - this.left) / view.width;
            let scaleH = (this.top - this.bottom) / view.height;

            left += scaleW * (this.view.offsetX / zoomW);
            right = left + scaleW * (this.view.width / zoomW);
            top -= scaleH * (this.view.offsetY / zoomH);
            bottom = top - scaleH * (this.view.height / zoomH);
        }

        mat4.makeOrthographic(this._projection, left, right, top, bottom, this.near, this.far);
        this._projection[5] *= -1;
        mat4.invert(this._projectionInverse, this._projection);
    }

    /**
     * Sets the view offset
     * @param {number} fullWidth
     * @param {number} fullHeight
     * @param {number} x
     * @param {number} y
     * @param {number} width
     * @param {number} height
     */
    SetViewOffset(fullWidth, fullHeight, x, y, width, height)
    {
        this.aspect = fullWidth/fullHeight;
        if (!this.view) this.view = new CameraView();
        this.view.SetValues({ fullWidth, fullHeight, x, y, width, height });
    }

}
