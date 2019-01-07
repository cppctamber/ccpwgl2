import {vec3, vec4} from "../../../global";
import {Tw2StagingClass} from "../../class";

/**
 * Tw2PointLight
 * @ccp Tr2PointLight
 *
 * @parameter {Number} brightness     -
 * @parameter {vec4} color            -
 * @parameter {Number} noiseAmplitude -
 * @parameter {Number} noiseFrequency -
 * @parameter {Number} noiseOctaves   -
 * @parameter {vec3} position         -
 * @parameter {Number} radius         -
 */
export default class Tw2PointLight extends Tw2StagingClass
{

    brightness = 0;
    color = vec4.create();
    noiseAmplitude = 0;
    noiseFrequency = 0;
    noiseOctaves = 0;
    position = vec3.create();
    radius = 0;

}

Tw2StagingClass.define(Tw2PointLight, Type =>
{
    return {
        type: "Tw2PointLight",
        props: {
            brightness: Type.NUMBER,
            color: Type.RGBA_LINEAR,
            noiseAmplitude: Type.NUMBER,
            noiseFrequency: Type.NUMBER,
            noiseOctaves: Type.NUMBER,
            position: Type.TR_TRANSLATION,
            radius: Type.NUMBER
        }
    };
});

