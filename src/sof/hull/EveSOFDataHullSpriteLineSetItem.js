import {quat, vec3} from "../../global";
import {Tw2BaseClass} from "../../global";

/**
 * EveSOFDataHullSpriteLineSetItem
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
 */
export class EveSOFDataHullSpriteLineSetItem extends Tw2BaseClass
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

Tw2BaseClass.define(EveSOFDataHullSpriteLineSetItem, Type =>
{
    return {
        isStaging: true,
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

