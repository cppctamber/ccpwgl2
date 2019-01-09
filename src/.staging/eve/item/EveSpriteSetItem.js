import {vec3, vec4} from "../../../global";
import {Tw2BaseClass} from "../../class";

/**
 * EveSpriteSetItem
 * @implements EveObjectSetItem
 *
 * @parameter {Number} blinkPhase -
 * @parameter {Number} blinkRate  -
 * @parameter {Number} boneIndex  -
 * @parameter {vec4} color        -
 * @parameter {Number} falloff    -
 * @parameter {Number} maxScale   -
 * @parameter {Number} minScale   -
 * @parameter {vec3} position     -
 * @parameter {vec4} warpColor    -
 */
export default class EveSpriteSetItem extends Tw2BaseClass
{

    blinkPhase = 0;
    blinkRate = 0;
    boneIndex = 0;
    color = vec4.create();
    falloff = 0;
    maxScale = 0;
    minScale = 0;
    position = vec3.create();
    warpColor = vec4.create();

}

Tw2BaseClass.define(EveSpriteSetItem, Type =>
{
    return {
        isStaging: true,
        type: "EveSpriteSetItem",
        category: "EveObjectSetItem",
        props: {
            blinkPhase: Type.NUMBER,
            blinkRate: Type.NUMBER,
            boneIndex: Type.NUMBER,
            color: Type.RGBA_LINEAR,
            falloff: Type.NUMBER,
            maxScale: Type.NUMBER,
            minScale: Type.NUMBER,
            position: Type.TR_TRANSLATION,
            warpColor: Type.RGBA_LINEAR
        }
    };
});

