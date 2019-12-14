import { meta, quat, vec3, mat4 } from "global";
import { Tw2RenderBatch } from "core";
import { EveObjectSet, EveObjectSetItem } from "./EveObjectSet";

/**
 * Haze set render batch
 *
 * @property {EveHazeSet} hazeSet
 */
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


/**
 * Haze item
 *
 * @property {Boolean} boosterGainInfluence -
 * @property {Number} colorType             -
 * @property {Number} hazeBrightness        -
 * @property {Number} hazeFalloff           -
 * @property {vec3} position                - Item's position
 * @property {quat} rotation                - Item's rotation
 * @property {vec3} scaling                 - Item's scaling
 * @property {Number} sourceBrightness      -
 * @property {Number} sourceSize            -
 * @property {mat4} transform               - Item's local transform
 */
@meta.notImplemented
@meta.type("EveHazeSetItem", true)
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


/**
 * Haze set
 */
@meta.notImplemented
@meta.type("EveHazeSet", true)
export class EveHazeSet extends EveObjectSet
{

}
