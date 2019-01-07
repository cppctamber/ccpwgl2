import {mat4, vec3, vec4} from "../../../global";
import {Tw2StagingClass} from "../../class";

/**
 * EveSpotlightSetItem
 * @implements EveObjectSetItem
 *
 * @parameter {vec4} coneColor   -
 * @parameter {vec4} flareColor  -
 * @parameter {vec4} spriteColor -
 * @parameter {vec3} spriteScale -
 * @parameter {mat4} transform   -
 */
export default class EveSpotlightSetItem extends Tw2StagingClass
{

    coneColor = vec4.create();
    flareColor = vec4.create();
    spriteColor = vec4.create();
    spriteScale = vec3.fromValues(1, 1, 1);
    transform = mat4.create();

}

Tw2StagingClass.define(EveSpotlightSetItem, Type =>
{
    return {
        type: "EveSpotlightSetItem",
        category: "EveObjectSetItem",
        props: {
            coneColor: Type.RGBA_LINEAR,
            flareColor: Type.RGBA_LINEAR,
            spriteColor: Type.RGBA_LINEAR,
            spriteScale: Type.TR_SCALING,
            transform: Type.MATRIX4
        }
    };
});

