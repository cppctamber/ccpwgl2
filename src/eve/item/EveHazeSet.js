import {quat, vec3, mat4, Tw2BaseClass} from "../../global";
import {Tw2RenderBatch} from "../../core";
import {EveObjectSet, EveObjectSetItem} from "./EveObjectSet";

/**
 * Haze set render batch
 * @ccp N/A
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
 * Haze item
 * @ccp EveHazeSetItem
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
export class EveHazeSetItem extends EveObjectSetItem
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
    transform = mat4.create();

    /**
     * Fires on value changes
     */
    OnValueChanged()
    {
        mat4.fromRotationTranslationScale(this.transform, this.rotation, this.position, this.scaling);
        this._dirty = true;
    }

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
 * Haze set
 * TODO: Implement
 * @ccp EveHazeSet
 */
export class EveHazeSet extends EveObjectSet
{

    /**
     * Unloads the object's buffers
     */
    Unload()
    {
        // TODO: Unload buffers
    }

    /**
     * Rebuilds the haze set's buffers
     */
    Rebuild()
    {
        // TODO: Rebuild buffers
    }

    /**
     * Gets the plane set's render batches
     * @param {Number} mode
     * @param {Tw2BatchAccumulator} accumulator
     * @param {Tw2PerObjectData} perObjectData
     */
    GetBatches(mode, accumulator, perObjectData)
    {
        // TODO: GetBatches
    }

    /**
     * Renders the haze set
     * @param {String} technique - technique name
     */
    Render(technique)
    {
        // TODO: Render
    }

}

Tw2BaseClass.define(EveHazeSet, Type =>
{
    return {
        isStaging: true,
        type: "EveHazeSet",
        category: "EveObjectSet",
        props: {
            items: ["EveHazeSetItem"]
        },
        notImplemented: ["*"]
    };
});

