import { Tw2Transform } from "core/Tw2Transform";
import {  mat4, vec3 } from "math";
import { meta } from "utils";

/**
 * Camera base class
 *
 * @property {CameraView|null} view
 * @property {mat4} _projection
 * @property {mat4} _projectionInverse
 * @property {mat4} _worldInverse
 * @property {boolean} _rebuildLocal
 */
export class Camera extends Tw2Transform
{

    view = null;

    controller = null;

    _projection = mat4.create();
    _projectionInverse = mat4.create();
    _worldInverse = mat4.create();
    _rebuildLocal = true;

    get isCamera()
    {
        return true;
    }

    /**
     * Helper for targeting a camera to a specific object
     * @param target
     */
    Focus(target)
    {

    }

    /**
     * Local rotation to look at a local coordinate
     * @param {vec3} v
     * @returns {Camera}
     */
    LookAt(v)
    {
        return super.LookAt(v, true);
    }

    /**
     * Local rotation to look at a world coordinate
     * @param {vec3} v
     * @returns {Camera}
     */
    LookAtWorld(v)
    {
        return super.LookAtWorld(v, true);
    }

    /**
     * Gets the world direction
     * @param {vec3} out
     * @return {vec3}
     */
    GetWorldDirection(out)
    {
        this.RebuildTransforms();
        vec3.set(out, -this._worldTransform[8], -this._worldTransform[9], -this._worldTransform[10]);
        return vec3.normalize(out, out);
    }

    /**
     * Gets the view matrix
     * @param {mat4} out
     * @return {mat4} out
     */
    GetView(out)
    {
        this.RebuildTransforms();
        return mat4.copy(out, this._worldInverse);
    }

    /**
     * Gets the projection matrix
     * @param {mat4} out
     * @param {Number} [aspect]
     * @return {mat4} out
     */
    GetProjection(out, aspect)
    {
        if (aspect && "aspect" in this && aspect !== this.aspect)
        {
            this.aspect = aspect;
            this._rebuildLocal = true;
        }

        this.RebuildTransforms();
        return mat4.copy(out, this._projection);
    }

    /**
     * Per frame update
     * @param {Number} dt
     */
    Update(dt)
    {
        if (this.controller)
        {
            if (this.controller.Update)
            {
                this.controller.Update(dt);
            }
            else if (this.controller.InternalUpdate)
            {
                this.controller.InternalUpdate(dt);
            }
        }

        this.EmitEvent("update", dt);
    }

    /**
     * Fires on changes values
     * @param opt
     */
    OnValueChanged(opt)
    {
        this._rebuildLocal = true;
    }

    @meta.abstract
    GetNearPlane()
    {

    }

    @meta.abstract
    GetFarPlane()
    {

    }

}

Camera.DEFAULT_FOV = 50;
Camera.DEFAULT_ZOOM = 1;
Camera.DEFAULT_NEAR = 0.1;
Camera.DEFAULT_FAR = 2000;
Camera.DEFAULT_ASPECT = 1;
Camera.DEFAULT_FOCUS = 10;
Camera.DEFAULT_FILM_GAUGE = 35;
Camera.DEFAULT_FILM_OFFSET = 0;
