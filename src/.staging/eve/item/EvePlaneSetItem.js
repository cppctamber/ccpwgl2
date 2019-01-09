import {quat, vec3, vec4} from "../../../global";
import {Tw2BaseClass} from "../../class";

/**
 * EvePlaneSetItem
 * @implements EveObjectSetItem
 *
 * @parameter {vec4} color           -
 * @parameter {vec4} layer1Scroll    -
 * @parameter {vec4} layer1Transform -
 * @parameter {vec4} layer2Scroll    -
 * @parameter {vec4} layer2Transform -
 * @parameter {Number} maskAtlasID   -
 * @parameter {vec3} position        -
 * @parameter {quat} rotation        -
 * @parameter {vec3} scaling         -
 */
export default class EvePlaneSetItem extends Tw2BaseClass
{

    color = vec4.create();
    layer1Scroll = vec4.create();
    layer1Transform = vec4.create();
    layer2Scroll = vec4.create();
    layer2Transform = vec4.create();
    maskAtlasID = 0;
    position = vec3.create();
    rotation = quat.create();
    scaling = vec3.fromValues(1, 1, 1);

}

Tw2BaseClass.define(EvePlaneSetItem, Type =>
{
    return {
        isStaging: true,
        type: "EvePlaneSetItem",
        category: "EveObjectSetItem",
        props: {
            color: Type.RGBA_LINEAR,
            layer1Scroll: Type.VECTOR4,
            layer1Transform: Type.VECTOR4,
            layer2Scroll: Type.VECTOR4,
            layer2Transform: Type.VECTOR4,
            maskAtlasID: Type.NUMBER,
            position: Type.TR_TRANSLATION,
            rotation: Type.TR_ROTATION,
            scaling: Type.TR_SCALING
        }
    };
});

