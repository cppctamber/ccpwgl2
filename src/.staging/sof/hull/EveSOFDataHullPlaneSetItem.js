import {quat, vec3, vec4} from "../../../global";
import {Tw2BaseClass} from "../../class";

/**
 * EveSOFDataHullPlaneSetItem
 *
 * @parameter {Number} boneIndex         -
 * @parameter {vec4} color               -
 * @parameter {Number} groupIndex        -
 * @parameter {vec4} layer1Scroll        -
 * @parameter {vec4} layer1Transform     -
 * @parameter {vec4} layer2Scroll        -
 * @parameter {vec4} layer2Transform     -
 * @parameter {Number} maskMapAtlasIndex -
 * @parameter {vec3} position            -
 * @parameter {quat} rotation            -
 * @parameter {vec3} scaling             -
 */
export default class EveSOFDataHullPlaneSetItem extends Tw2BaseClass
{

    boneIndex = 0;
    color = vec4.create();
    groupIndex = 0;
    layer1Scroll = vec4.create();
    layer1Transform = vec4.create();
    layer2Scroll = vec4.create();
    layer2Transform = vec4.create();
    maskMapAtlasIndex = 0;
    position = vec3.create();
    rotation = quat.create();
    scaling = vec3.fromValues(1, 1, 1);

}

Tw2BaseClass.define(EveSOFDataHullPlaneSetItem, Type =>
{
    return {
        isStaging: true,
        type: "EveSOFDataHullPlaneSetItem",
        props: {
            boneIndex: Type.NUMBER,
            color: Type.RGBA_LINEAR,
            groupIndex: Type.NUMBER,
            layer1Scroll: Type.VECTOR4,
            layer1Transform: Type.VECTOR4,
            layer2Scroll: Type.VECTOR4,
            layer2Transform: Type.VECTOR4,
            maskMapAtlasIndex: Type.NUMBER,
            position: Type.TR_TRANSLATION,
            rotation: Type.TR_ROTATION,
            scaling: Type.TR_SCALING
        }
    };
});

