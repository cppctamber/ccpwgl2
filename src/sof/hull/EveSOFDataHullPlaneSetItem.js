import {quat, vec3, vec4} from "../../global";


/**
 * EveSOFDataHullPlaneSetItem
 *
 * @property {Number} boneIndex         -
 * @property {vec4} color               -
 * @property {Number} groupIndex        -
 * @property {vec4} layer1Scroll        -
 * @property {vec4} layer1Transform     -
 * @property {vec4} layer2Scroll        -
 * @property {vec4} layer2Transform     -
 * @property {Number} maskMapAtlasIndex -
 * @property {vec3} position            -
 * @property {quat} rotation            -
 * @property {vec3} scaling             -
 */
export class EveSOFDataHullPlaneSetItem
{

    boneIndex = -1;
    color = vec4.create();
    groupIndex = -1;
    layer1Scroll = vec4.create();
    layer1Transform = vec4.create();
    layer2Scroll = vec4.create();
    layer2Transform = vec4.create();
    maskMapAtlasIndex = 0;
    position = vec3.create();
    rotation = quat.create();
    scaling = vec3.fromValues(1, 1, 1);

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            ["boneIndex", r.uint],
            ["color", r.vector4],
            ["groupIndex", r.uint],
            ["layer1Scroll", r.vector4],
            ["layer1Transform", r.vector4],
            ["layer2Scroll", r.vector4],
            ["layer2Transform", r.vector4],
            ["maskMapAtlasIndex", r.uint],
            ["position", r.vector3],
            ["rotation", r.vector4],
            ["scaling", r.vector3]
        ];
    }
}