import {quat, vec3} from "../../../global";
import {Tw2StagingClass} from "../../class";

/**
 * EveHazeSetItem
 * @implements EveObjectSetItem
 *
 * @parameter {Boolean} boosterGainInfluence -
 * @parameter {Number} colorType             -
 * @parameter {Number} hazeBrightness        -
 * @parameter {Number} hazeFalloff           -
 * @parameter {vec3} position                -
 * @parameter {quat} rotation                -
 * @parameter {vec3} scaling                 -
 * @parameter {Number} sourceBrightness      -
 * @parameter {Number} sourceSize            -
 */
export default class EveHazeSetItem extends Tw2StagingClass
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

Tw2StagingClass.define(EveHazeSetItem, Type =>
{
    return {
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

