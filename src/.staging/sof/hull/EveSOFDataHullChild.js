import {quat, vec3} from "../../../global";
import {Tw2StagingClass} from "../../class";

/**
 * EveSOFDataHullChild
 *
 * @parameter {Number} groupIndex       -
 * @parameter {Number} lowestLodVisible -
 * @parameter {String} redFilePath      -
 * @parameter {quat} rotation           -
 * @parameter {vec3} scaling            -
 * @parameter {vec3} translation        -
 */
export default class EveSOFDataHullChild extends Tw2StagingClass
{

    groupIndex = 0;
    lowestLodVisible = 0;
    redFilePath = "";
    rotation = quat.create();
    scaling = vec3.fromValues(1, 1, 1);
    translation = vec3.create();

}

Tw2StagingClass.define(EveSOFDataHullChild, Type =>
{
    return {
        type: "EveSOFDataHullChild",
        props: {
            groupIndex: Type.NUMBER,
            lowestLodVisible: Type.NUMBER,
            redFilePath: Type.PATH,
            rotation: Type.TR_ROTATION,
            scaling: Type.TR_SCALING,
            translation: Type.TR_TRANSLATION
        }
    };
});

