import {mat4, vec3} from "../../global";
import {EveSOFBaseClass} from "../EveSOFBaseClass";

/**
 * EveSOFDataHullSpotlightSetItem
 *
 * @property {Number} boneIndex             -
 * @property {Boolean} boosterGainInfluence -
 * @property {Number} coneIntensity         -
 * @property {Number} flareIntensity        -
 * @property {Number} groupIndex            -
 * @property {Number} spriteIntensity       -
 * @property {vec3} spriteScale             -
 * @property {mat4} transform               -
 */
export class EveSOFDataHullSpotlightSetItem extends EveSOFBaseClass
{

    boneIndex = -1;
    boosterGainInfluence = false;
    coneIntensity = 0;
    flareIntensity = 0;
    groupIndex = -1;
    spriteIntensity = 0;
    spriteScale = vec3.fromValues(1, 1, 1);
    transform = mat4.create();

}

EveSOFDataHullSpotlightSetItem.define(r =>
{
    return {
        type: "EveSOFDataHullSpotlightSetItem",
        black: [
            ["boneIndex", r.uint],
            ["boosterGainInfluence", r.boolean],
            ["coneIntensity", r.float],
            ["flareIntensity", r.float],
            ["groupIndex", r.uint],
            ["spriteScale", r.vector3],
            ["spriteIntensity", r.float],
            ["transform", r.matrix]
        ]
    };
});