import {vec3} from "../../global";
import {Tw2BaseClass} from "../../global";

/**
 * EveSOFDataHullSpriteSetItem
 *
 * @property {Number} blinkPhase -
 * @property {Number} blinkRate  -
 * @property {Number} boneIndex  -
 * @property {Number} colorType  -
 * @property {Number} falloff    -
 * @property {Number} intensity  -
 * @property {Number} maxScale   -
 * @property {Number} minScale   -
 * @property {vec3} position     -
 */
export class EveSOFDataHullSpriteSetItem extends Tw2BaseClass
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

