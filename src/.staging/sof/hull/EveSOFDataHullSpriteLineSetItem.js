import {quat, vec3} from "../../../global";
import {Tw2StagingClass} from "../../class";

/**
 * EveSOFDataHullSpriteLineSetItem
 *
 * @parameter {Number} blinkPhase      -
 * @parameter {Number} blinkPhaseShift -
 * @parameter {Number} blinkRate       -
 * @parameter {Number} boneIndex       -
 * @parameter {Number} colorType       -
 * @parameter {Number} falloff         -
 * @parameter {Number} intensity       -
 * @parameter {Boolean} isCircle       -
 * @parameter {Number} maxScale        -
 * @parameter {Number} minScale        -
 * @parameter {vec3} position          -
 * @parameter {quat} rotation          -
 * @parameter {vec3} scaling           -
 * @parameter {Number} spacing         -
 */
export default class EveSOFDataHullSpriteLineSetItem extends Tw2StagingClass
{

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

}

Tw2StagingClass.define(EveSOFDataHullSpriteLineSetItem, Type =>
{
    return {
        type: "EveSOFDataHullSpriteLineSetItem",
        props: {
            blinkPhase: Type.NUMBER,
            blinkPhaseShift: Type.NUMBER,
            blinkRate: Type.NUMBER,
            boneIndex: Type.NUMBER,
            colorType: Type.NUMBER,
            falloff: Type.NUMBER,
            intensity: Type.NUMBER,
            isCircle: Type.BOOLEAN,
            maxScale: Type.NUMBER,
            minScale: Type.NUMBER,
            position: Type.TR_TRANSLATION,
            rotation: Type.TR_ROTATION,
            scaling: Type.TR_SCALING,
            spacing: Type.NUMBER
        }
    };
});

