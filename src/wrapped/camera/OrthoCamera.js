import { Camera } from "./Camera";
import { mat4 } from "math";
import { device } from "global/tw2";
import { meta } from "utils";

export class OrthoCamera extends Camera
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
    near = 1;

    @meta.float
    far = 10000;


    get isOrthographicCamera()
    {
        return true;
    }

    /**
     * Fires when the world transform is modified
     * @param {mat4} world
     */
    OnWorldTransformModified(world)
    {
        mat4.ortho(this._projection, this.left, this.right, this.top, this.bottom, this.far, this.near);
        this._projection[10] *= -1;
        mat4.invert(this._projectionInverse, this._projection);
    }

}
