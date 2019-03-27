import {quat, vec3} from "../../global";
import {EveSOFBaseClass} from "../EveSOFBaseClass";

/**
 * EveSOFDataHullBanner
 *
 * @property {String} name      -
 * @property {Number} angleX    -
 * @property {Number} angleY    -
 * @property {Number} boneIndex -
 * @property {vec3} position    -
 * @property {quat} rotation    -
 * @property {vec3} scaling     -
 * @property {Number} usage     -
 */
export class EveSOFDataHullBanner extends EveSOFBaseClass
{

    name = "";
    angleX = 0;
    angleY = 0;
    boneIndex = -1;
    position = vec3.create();
    rotation = quat.create();
    scaling = vec3.fromValues(1, 1, 1);
    usage = 0;

}

EveSOFDataHullBanner.define(r =>
{
    return {
        type: "EveSOFDataHullBanner",
        black: [
            ["angleX", r.float],
            ["angleY", r.float],
            ["angleZ", r.float],
            ["boneIndex", r.uint],
            ["name", r.string],
            ["position", r.vector3],
            ["rotation", r.vector4],
            ["scaling", r.vector3],
            ["usage", r.uint]
        ]
    };
});