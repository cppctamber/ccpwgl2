import {mat4, quat, vec3, vec4} from "../../../global";
import {Tw2BaseClass} from "../../../global";

/**
 * EveChildQuad
 * @implements ObjectChild
 *
 * @property {Number} brightness    -
 * @property {vec4} color           -
 * @property {Tr2Effect} effect     -
 * @property {mat4} localTransform  -
 * @property {Number} minScreenSize -
 * @property {quat} rotation        -
 * @property {vec3} scaling         -
 * @property {vec3} translation     -
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

