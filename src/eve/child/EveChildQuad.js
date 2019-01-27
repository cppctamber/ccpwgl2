import {mat4, quat, vec3, vec4} from "../../global/index";
import {EveChild} from "./EveChild";

/**
 * EveChildQuad
 * TODO: Implement
 * @ccp EveChildQuat
 *
 * @property {Number} brightness        -
 * @property {vec4} color               -
 * @property {Tr2Effect} effect         -
 * @property {mat4} localTransform      -
 * @property {Number} minScreenSize     -
 * @property {quat} rotation            -
 * @property {vec3} scaling             -
 * @property {vec3} translation         -
 */
export default class EveChildQuad extends EveChild
{

    // ccp
    brightness = 0;
    color = vec4.create();
    effect = null;
    localTransform = mat4.create();
    minScreenSize = 0;
    rotation = quat.create();
    scaling = vec3.fromValues(1, 1, 1);
    translation = vec3.create();

}

EveChild.define(EveChildQuad, Type =>
{
    return {
        isStaging: true,
        type: "EveChildQuad",
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

