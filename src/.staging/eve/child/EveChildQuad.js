import {mat4, quat, vec3, vec4} from "../../../global";
import {Tw2StagingClass} from "../../class";

/**
 * EveChildQuad
 * @implements ObjectChild
 *
 * @parameter {Number} brightness    -
 * @parameter {vec4} color           -
 * @parameter {Tw2Effect} effect     -
 * @parameter {mat4} localTransform  -
 * @parameter {Number} minScreenSize -
 * @parameter {quat} rotation        -
 * @parameter {vec3} scaling         -
 * @parameter {vec3} translation     -
 */
export default class EveChildQuad extends Tw2StagingClass
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

Tw2StagingClass.define(EveChildQuad, Type =>
{
    return {
        type: "EveChildQuad",
        category: "ObjectChild",
        props: {
            brightness: Type.NUMBER,
            color: Type.RGBA_LINEAR,
            effect: ["Tw2Effect"],
            localTransform: Type.TR_LOCAL,
            minScreenSize: Type.NUMBER,
            rotation: Type.TR_ROTATION,
            scaling: Type.TR_SCALING,
            translation: Type.TR_TRANSLATION
        }
    };
});

