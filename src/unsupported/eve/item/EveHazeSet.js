import { meta } from "utils";
import { quat, vec3, mat4 } from "math";
import { Tw2RenderBatch } from "core";
import { EveObjectSet, EveObjectSetItem } from "eve";


@meta.notImplemented
export class EveHazeSetBatch extends Tw2RenderBatch
{

    hazeSet = null;

    /**
     * Commits the haze set for rendering
     * @param {String} technique - technique name
     */
    Commit(technique)
    {
        this.hazeSet.Render(technique);
    }

}


@meta.notImplemented
@meta.ctor("EveHazeSetItem")
export class EveHazeSetItem extends EveObjectSetItem
{

    @meta.boolean
    boosterGainInfluence = false;

    @meta.uint
    colorType = 0;

    @meta.float
    hazeBrightness = 0;

    @meta.float
    hazeFalloff = 0;

    @meta.vector3
    position = vec3.create();

    @meta.quaternion
    rotation = quat.create();

    @meta.vector3
    scaling = vec3.fromValues(1, 1, 1);

    @meta.float
    sourceBrightness = 0;

    @meta.float
    sourceSize = 0;


    _transform = mat4.create();

    /**
     * Fires on value changes
     */
    OnValueChanged()
    {
        mat4.fromRotationTranslationScale(this._transform, this.rotation, this.position, this.scaling);
        this._dirty = true;
    }

}


@meta.notImplemented
@meta.ctor("EveHazeSet")
export class EveHazeSet extends EveObjectSet
{

}
