import {mat4, vec3} from "../../../global";
import {Tw2StagingClass} from "../../class";

/**
 * EveSOFDataHullSpotlightSetItem
 *
 * @parameter {Number} boneIndex             -
 * @parameter {Boolean} boosterGainInfluence -
 * @parameter {Number} coneIntensity         -
 * @parameter {Number} flareIntensity        -
 * @parameter {Number} groupIndex            -
 * @parameter {Number} spriteIntensity       -
 * @parameter {vec3} spriteScale             -
 * @parameter {mat4} transform               -
 */
export default class EveSOFDataHullSpotlightSetItem extends Tw2StagingClass
{

    boneIndex = 0;
    boosterGainInfluence = false;
    coneIntensity = 0;
    flareIntensity = 0;
    groupIndex = 0;
    spriteIntensity = 0;
    spriteScale = vec3.fromValues(1, 1, 1);
    transform = mat4.create();

}

Tw2StagingClass.define(EveSOFDataHullSpotlightSetItem, Type =>
{
    return {
        type: "EveSOFDataHullSpotlightSetItem",
        props: {
            boneIndex: Type.NUMBER,
            boosterGainInfluence: Type.BOOLEAN,
            coneIntensity: Type.NUMBER,
            flareIntensity: Type.NUMBER,
            groupIndex: Type.NUMBER,
            spriteIntensity: Type.NUMBER,
            spriteScale: Type.TR_SCALING,
            transform: Type.MATRIX4
        }
    };
});

