import {vec3} from "../../../global";
import {Tw2BaseClass} from "../../class";

/**
 * EveSOFDataHullSpriteSetItem
 *
 * @parameter {Number} blinkPhase -
 * @parameter {Number} blinkRate  -
 * @parameter {Number} boneIndex  -
 * @parameter {Number} colorType  -
 * @parameter {Number} falloff    -
 * @parameter {Number} intensity  -
 * @parameter {Number} maxScale   -
 * @parameter {Number} minScale   -
 * @parameter {vec3} position     -
 */
export default class EveSOFDataHullSpriteSetItem extends Tw2BaseClass
{

    blinkPhase = 0;
    blinkRate = 0;
    boneIndex = 0;
    colorType = 0;
    falloff = 0;
    intensity = 0;
    maxScale = 0;
    minScale = 0;
    position = vec3.create();

}

Tw2BaseClass.define(EveSOFDataHullSpriteSetItem, Type =>
{
    return {
        isStaging: true,
        type: "EveSOFDataHullSpriteSetItem",
        props: {
            blinkPhase: Type.NUMBER,
            blinkRate: Type.NUMBER,
            boneIndex: Type.NUMBER,
            colorType: Type.NUMBER,
            falloff: Type.NUMBER,
            intensity: Type.NUMBER,
            maxScale: Type.NUMBER,
            minScale: Type.NUMBER,
            position: Type.TR_TRANSLATION
        }
    };
});

