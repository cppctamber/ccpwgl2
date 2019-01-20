import {quat, vec3} from "../../global";
import {Tw2BaseClass} from "../../global";

/**
 * EveSOFDataHullBanner
 *
 * @property {Number} angleX    -
 * @property {Number} angleY    -
 * @property {Number} boneIndex -
 * @property {vec3} position    -
 * @property {quat} rotation    -
 * @property {vec3} scaling     -
 * @property {Number} usage     -
 */
export default class EveSOFDataHullBanner extends Tw2BaseClass
{

    angleX = 0;
    angleY = 0;
    boneIndex = 0;
    position = vec3.create();
    rotation = quat.create();
    scaling = vec3.fromValues(1, 1, 1);
    usage = 0;

}

Tw2BaseClass.define(EveSOFDataHullBanner, Type =>
{
    return {
        isStaging: true,
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

