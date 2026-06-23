import { Camera } from "./Camera";
import { CameraView } from "./CameraView";
import { mat4, num, vec3 } from "math";
import { meta } from "utils";

export class PerspectiveCamera extends Camera
{

    @meta.float
    fov = 50;

    @meta.float
    zoom = 1;

    @meta.float
    near = 1;

    @meta.float
    far = 10000;

    @meta.float
    aspect = 1;

    @meta.float
    filmGauge = 35;

    @meta.float
    filmOffset = 0;

    get isPerspectiveCamera()
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
     * Fires when the world matrix has been updated
     * @param {mat4} world
     */
    OnWorldTransformModified(world)
    {
        let
            top = this.near * Math.tan(num.DEG2RAD * 0.5 * this.fov) / this.zoom,
            height = 2 * top,
            width = this.aspect * height,
            left = -0.5 * width;

        const view = this.view;
        if (view && view.enabled)
        {
            let { fullWidth, fullHeight } = view;
            left += view.offsetX * width / fullWidth;
            top -= view.offsetY * height / fullHeight;
            width *= view.width / fullWidth;
            height *= view.height / fullHeight;
        }

        let skew = this.filmOffset;
        if (skew !== 0) left += this.near * skew / this.GetFilmWidth();

        mat4.makePerspective(this._projection, left, left + width, top, top - height, this.near, this.far);
        mat4.invert(this._projectionInverse, this._projection);
    }

    /**
     *
     * @param focalLength
     */
    SetFocalLength(focalLength)
    {
        let vExtentSlope = 0.5 * this.GetFilmHeight() / focalLength;
        this.fov = num.RAD2DEG * 2 * Math.atan(vExtentSlope);
        this._rebuildLocal = true;
    }

    /**
     *
     * @return {number}
     */
    GetEffectiveFOV()
    {
        return num.RAD2DEG * 2 * Math.atan(Math.tan(num.DEG2RAD * 0.5 * this.fov) / this.zoom);
    }

    /**
     *
     * @return {number}
     */
    GetFilmWidth()
    {
        // film not completely covered in portrait format (aspect < 1)
        return this.filmGauge * Math.min(this.aspect, 1);
    }

    /**
     *
     * @return {number}
     */
    GetFilmHeight()
    {
        // film not completely covered in landscape format (aspect > 1)
        return this.filmGauge / Math.max(this.aspect, 1);
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
