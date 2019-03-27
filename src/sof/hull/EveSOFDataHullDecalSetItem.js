import {vec3, quat} from "../../global";
import {EveSOFBaseClass} from "../EveSOFBaseClass";

/**
 * EveSOFDataHullDecalSetItem
 * @ccp EveSOFDataHullDecalSetItem
 *
 * @property {String} name
 * @property {Number} boneIndex
 * @property {Number[]} indexBuffer
 * @property {Number} glowColorType
 * @property {Number} logoType
 * @property {Number} meshIndex
 * @property {Array<EveSOFDataParameter>} parameters
 * @property {vec3} position
 * @property {quat} rotation
 * @property {vec3} scaling
 * @property {Array<EveSOFDataTexture>} texture
 * @property {String} visibilityGroup
 */
export class EveSOFDataHullDecalSetItem extends EveSOFBaseClass
{

    name = "";
    boneIndex = -1;
    indexBuffer = [];
    glowColorType = 0;
    logoType = 0;
    meshIndex = 0;
    parameters = [];
    position = vec3.create();
    rotation = quat.create();
    scaling = vec3.fromValues(1, 1, 1);
    textures = [];
    usage = 0;
    visibilityGroup = "";

}

EveSOFDataHullDecalSetItem.define(r =>
{
    return {
        type: "EveSOFDataHullDecalSetItem",
        black: [
            ["name", r.string],
            ["boneIndex", r.uint],
            ["indexBuffer", r.indexBuffer],
            ["glowColorType", r.uint],
            ["logoType", r.uint],
            ["meshIndex", r.uint],
            ["parameters", r.array],
            ["position", r.vector3],
            ["rotation", r.vector4],
            ["scaling", r.vector3],
            ["textures", r.array],
            ["usage", r.uint],
            ["visibilityGroup", r.string],
        ]
    };
});