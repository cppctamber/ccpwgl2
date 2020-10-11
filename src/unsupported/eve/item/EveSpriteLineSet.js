import { vec3, quat, mat4, meta } from "global";
import { EveObjectSet, EveObjectSetItem } from "eve";


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


@meta.notImplemented
@meta.ctor("EveSpriteLineSetItem")
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


@meta.notImplemented
@meta.ctor("EveSpriteLineSet")
export class EveSpriteLineSet extends EveObjectSet
{

}
