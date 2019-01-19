import {vec3, quat, mat4} from "../../global";
import {EveObjectSet, EveObjectSetItem} from "./EveObjectSet";

/**
 * Eve sprite line set render batch
 *
 * @property {EveSpriteLineSet} spriteLineSet
 */
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
 * Todo: Is this actually a class?
 * @ccp ???
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
export class EveSpriteLineSetItem extends EveObjectSetItem
{
    // ccp
    blinkPhase = 0;
    blinkPhaseShift = 0;
    blinkRate = 0;
    boneIndex = 0;
    colorType = 0;
    falloff = 0;
    intensity = 0;
    isCircle = false;
    maxScale = 0;
    minScale = 0;
    position = vec3.create();
    rotation = quat.create();
    scaling = vec3.fromValues(1, 1, 1);
    spacing = 0;

    // ccpwgl
    display = true;
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

EveObjectSet.define(EveSpriteLineSetItem, Type =>
{
    return {
        type: "EveSpriteLineSetItem",
        isStaging: true,
        props: {
            blinkPhase: Type.NUMBER,
            blinkPhaseShift: Type.NUMBER,
            blinkRate: Type.NUMBER,
            boneIndex: Type.NUMBER,
            colorType: Type.NUMBER,
            display: Type.BOOLEAN,
            falloff: Type.NUMBER,
            intensity: Type.NUMBER,
            isCircle: Type.BOOLEAN,
            maxScale: Type.NUMBER,
            minScale: Type.NUMBER,
            position: Type.TR_TRANSLATION,
            rotation: Type.TR_ROTATION,
            scaling: Type.TR_SCALING,
            spacing: Type.NUMBER,
            transform: Type.TR_LOCAL
        },
        notImplemented: ["*"]
    };
});



/**
 * Sprite line set
 * @TODO: Is this actually a class?
 * @ccp ???
 *
 * @property {Array<EveSpriteLineSetItem>} items
 */
export class EveSpriteLineSet extends EveObjectSet
{

    /**
     * Unloads the sprite line set's buffers
     */
    Unload()
    {
        // TODO: Unload
    }

    /**
     * Rebuilds the sprite line set's buffers
     */
    Rebuild()
    {
        // TODO: Rebuild
    }

    /**
     * Gets the sprite line set's render batches
     * @param {Number} mode
     * @param {Tw2BatchAccumulator} accumulator
     * @param {Tw2PerObjectData} perObjectData
     */
    GetBatches(mode, accumulator, perObjectData)
    {
        // TODO: GetBatches
    }

    /**
     * Renders the sprite line set
     * @param {String} technique - technique name
     * @returns {Boolean}        - true if rendered
     */
    Render(technique)
    {
        // TODO: Render
    }
    
}

EveObjectSet.define(EveSpriteLineSet, Type =>
{
    return {
        type: "EveSpriteLineSet",
        isStaging: true,
        props: {
            items: [["EveSpriteLineSetItem"]]
        },
        notImplemented: ["*"]
    };
});

