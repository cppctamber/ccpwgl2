import {vec3, quat, mat4, Tw2BaseClass} from "../../global";

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
 * EveSpriteLineSetItem
 * @implements EveObjectSetItem
 * Todo: Is this actually a class?
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
export class EveSpriteLineSetItem extends Tw2BaseClass
{
    // ccp ??
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

    /**
     * Fires on value changes
     */
    OnValueChanged()
    {
        mat4.fromRotationTranslationScale(this.transform, this.rotation, this.position, this.scaling);
    }

}

Tw2BaseClass.define(EveSpriteLineSetItem, Type =>
{
    return {
        type: "EveSpriteLineSetItem",
        category: "EveObjectSetItem",
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
 * EveSpriteLineSet
 * @TODO: Is this actually a class?
 *
 * @property items
 */
export class EveSpriteLineSet extends Tw2BaseClass
{
    // ccp?
    items = [];

    // ccpwgl
    display = true;
}

Tw2BaseClass.define(EveSpriteLineSet, Type =>
{
    return {
        type: "EveSpriteLineSet",
        category: "EveObjectSet",
        isStaging: true,
        props: {
            display: Type.BOOLEAN,
            items: [["EveSpriteLineSetItem"]]
        },
        notImplemented: ["*"]
    };
});

