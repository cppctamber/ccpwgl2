import {quat, vec3} from "../../../global";
import {Tw2BaseClass} from "../../../global";

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
 */
export default class EveHazeSetItem extends Tw2BaseClass
{

    boosterGainInfluence = false;
    colorType = 0;
    hazeBrightness = 0;
    hazeFalloff = 0;
    position = vec3.create();
    rotation = quat.create();
    scaling = vec3.fromValues(1, 1, 1);
    sourceBrightness = 0;
    sourceSize = 0;

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
            sourceSize: Type.NUMBER
        }
    };
});

