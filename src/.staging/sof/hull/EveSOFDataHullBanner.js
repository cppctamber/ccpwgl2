import {quat, vec3} from "../../../global";
import {Tw2StagingClass} from "../../class";

/**
 * EveSOFDataHullBanner
 *
 * @parameter {Number} angleX    -
 * @parameter {Number} angleY    -
 * @parameter {Number} boneIndex -
 * @parameter {vec3} position    -
 * @parameter {quat} rotation    -
 * @parameter {vec3} scaling     -
 * @parameter {Number} usage     -
 */
export default class EveSOFDataHullBanner extends Tw2StagingClass
{

    angleX = 0;
    angleY = 0;
    boneIndex = 0;
    position = vec3.create();
    rotation = quat.create();
    scaling = vec3.fromValues(1, 1, 1);
    usage = 0;

}

Tw2StagingClass.define(EveSOFDataHullBanner, Type =>
{
    return {
        type: "EveSOFDataHullBanner",
        props: {
            angleX: Type.NUMBER,
            angleY: Type.NUMBER,
            boneIndex: Type.NUMBER,
            position: Type.TR_TRANSLATION,
            rotation: Type.TR_ROTATION,
            scaling: Type.TR_SCALING,
            usage: Type.NUMBER
        }
    };
});

