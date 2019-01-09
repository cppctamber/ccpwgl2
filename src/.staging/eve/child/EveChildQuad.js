import {mat4, quat, vec3, vec4} from "../../../global";
import {Tw2BaseClass} from "../../class";

/**
 * EveChildQuad
 * @implements ObjectChild
 *
 * @parameter {Number} brightness    -
 * @parameter {vec4} color           -
 * @parameter {Tr2Effect} effect     -
 * @parameter {mat4} localTransform  -
 * @parameter {Number} minScreenSize -
 * @parameter {quat} rotation        -
 * @parameter {vec3} scaling         -
 * @parameter {vec3} translation     -
 */
export default class EveChildQuad extends Tw2BaseClass
{

    brightness = 0;
    color = vec4.create();
    effect = null;
    localTransform = mat4.create();
    minScreenSize = 0;
    rotation = quat.create();
    scaling = vec3.fromValues(1, 1, 1);
    translation = vec3.create();

}

Tw2BaseClass.define(EveChildQuad, Type =>
{
    return {
        isStaging: true,
        type: "EveChildQuad",
        category: "ObjectChild",
        props: {
            brightness: Type.NUMBER,
            color: Type.RGBA_LINEAR,
            effect: ["Tr2Effect"],
            localTransform: Type.TR_LOCAL,
            minScreenSize: Type.NUMBER,
            rotation: Type.TR_ROTATION,
            scaling: Type.TR_SCALING,
            translation: Type.TR_TRANSLATION
        }
    };
});

