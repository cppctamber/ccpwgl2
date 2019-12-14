import { vec3, quat, mat4, meta } from "global";
import { EveObjectSet, EveObjectSetItem } from "./EveObjectSet";

/**
 * Eve sprite line set render batch
 *
 * @property {EveSpriteLineSet} spriteLineSet
 */
@meta.notImplemented
export class EveSpriteLineSetBatch
{

    spriteLineSet = null;

    /**
     * Commits the batch for rendering
     * @param {String} technique
     */
    Commit(technique)
    {
        this.spriteLineSet.Render(technique);
    }

}

/**
 * Sprite line
 * TODO: Is this actually a class?
 *
 * @property {Number} blinkPhase      -
 * @property {Number} blinkPhaseShift -
 * @property {Number} blinkRate       -
 * @property {Number} boneIndex       -
 * @property {Number} colorType       -
 * @property {Number} falloff         -
 * @property {Number} intensity       -
 * @property {Boolean} isCircle       -
 * @property {Number} maxScale        -
 * @property {Number} minScale        -
 * @property {vec3} position          -
 * @property {quat} rotation          -
 * @property {vec3} scaling           -
 * @property {Number} spacing         -
 * @property {mat4} transform         -
 */
@meta.notImplemented
@meta.type("EveSpriteLineSetItem")
export class EveSpriteLineSetItem extends EveObjectSetItem
{

    @meta.float
    blinkPhase = 0;

    @meta.float
    blinkPhaseShift = 0;

    @meta.float
    blinkRate = 0;

    @meta.uint
    boneIndex = 0;

    @meta.uint
    colorType = 0;

    @meta.float
    falloff = 0;

    @meta.float
    intensity = 0;

    @meta.boolean
    isCircle = false;

    @meta.float
    maxScale = 0;

    @meta.float
    minScale = 0;

    @meta.vector3
    position = vec3.create();

    @meta.quaternion
    rotation = quat.create();

    @meta.vector3
    scaling = vec3.fromValues(1, 1, 1);

    @meta.float
    spacing = 0;

    @meta.boolean
    display = true;

    @meta.matrix4
    transform = mat4.create();

    _dirty = true;

    /**
     * Fires on value changes
     */
    OnValueChanged()
    {
        mat4.fromRotationTranslationScale(this.transform, this.rotation, this.position, this.scaling);
        this._dirty = true;
    }

}


/**
 * Sprite line set
 * TODO: Is this actually a class?
 *
 * @property {Array<EveSpriteLineSetItem>} items
 */
@meta.notImplemented
@meta.type("EveSpriteLineSet")
export class EveSpriteLineSet extends EveObjectSet
{

}
