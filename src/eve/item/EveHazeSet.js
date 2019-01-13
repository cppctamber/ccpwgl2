import {quat, vec3, mat4, Tw2BaseClass} from "../../global";
import {Tw2RenderBatch} from "../../core";

/**
 * Haze set render batch
 *
 * @property {EveHazeSet} hazeSet
 */
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
 * EveHazeSetItem
 * @implements EveObjectSetItem
 *
 * @property {Boolean} boosterGainInfluence -
 * @property {Number} colorType             -
 * @property {Number} hazeBrightness        -
 * @property {Number} hazeFalloff           -
 * @property {vec3} position                -
 * @property {quat} rotation                -
 * @property {vec3} scaling                 -
 * @property {Number} sourceBrightness      -
 * @property {Number} sourceSize            -
 * @property {Boolean} display              - Toggles item visibility
 * @property {mat4} transform               - The item's local transform
 */
export class EveHazeSetItem extends Tw2BaseClass
{
    // ccp
    boosterGainInfluence = false;
    colorType = 0;
    hazeBrightness = 0;
    hazeFalloff = 0;
    position = vec3.create();
    rotation = quat.create();
    scaling = vec3.fromValues(1, 1, 1);
    sourceBrightness = 0;
    sourceSize = 0;

    // ccpwgl
    display = true;
    transform = mat4.create();

}

Tw2BaseClass.define(EveHazeSetItem, Type =>
{
    return {
        isStaging: true,
        type: "EveHazeSetItem",
        category: "EveObjectSetItem",
        props: {
            boosterGainInfluence: Type.BOOLEAN,
            colorType: Type.NUMBER,
            display: Type.BOOLEAN,
            hazeBrightness: Type.NUMBER,
            hazeFalloff: Type.NUMBER,
            position: Type.TR_TRANSLATION,
            rotation: Type.TR_ROTATION,
            scaling: Type.TR_SCALING,
            sourceBrightness: Type.NUMBER,
            sourceSize: Type.NUMBER,
            transform: Type.TR_LOCAL
        },
        notImplemented: ["*"]
    };
});


/**
 * EveHazeSet
 * @implements EveObjectSet
 *
 * @property {EveObjectSetItem} items - Haze set items
 */
export class EveHazeSet extends Tw2BaseClass
{
    // ccp
    items = null;

    // ccpwgl
    display = true;

}

Tw2BaseClass.define(EveHazeSet, Type =>
{
    return {
        isStaging: true,
        type: "EveHazeSet",
        category: "EveObjectSet",
        props: {
            display: Type.BOOLEAN,
            items: ["EveHazeSetItem"]
        },
        notImplemented: ["*"]
    };
});

