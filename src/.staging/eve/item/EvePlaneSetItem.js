import {quat, vec3, vec4} from "../../../global";
import {Tw2BaseClass} from "../../../global";

/**
 * EvePlaneSetItem
 * @implements EveObjectSetItem
 *
 * @property {vec4} color           -
 * @property {vec4} layer1Scroll    -
 * @property {vec4} layer1Transform -
 * @property {vec4} layer2Scroll    -
 * @property {vec4} layer2Transform -
 * @property {Number} maskAtlasID   -
 * @property {vec3} position        -
 * @property {quat} rotation        -
 * @property {vec3} scaling         -
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

