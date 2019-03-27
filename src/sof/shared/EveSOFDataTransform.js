import {quat, vec3} from "../../global";
import {EveSOFBaseClass} from "../EveSOFBaseClass";

/**
 * EveSOFDataTransform
 *
 * @property {Number} boneIndex -
 * @property {vec3} position    -
 * @property {quat} rotation    -
 */
export class EveSOFDataTransform extends EveSOFBaseClass
{

    boneIndex = -1;
    position = vec3.create();
    rotation = quat.create();
    scaling = vec3.fromValues(1, 1, 1);

}

EveSOFDataTransform.define(r =>
{
    return {
        type: "EveSOFDataTransform",
        black: [
            ["boneIndex", r.uint],
            ["position", r.vector3],
            ["rotation", r.vector4],
            ["scaling", r.vector3],
        ]
    };
});