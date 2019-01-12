import {vec3, vec4, Tw2BaseClass} from "../../global";

/**
 * Tr2PointLight
 * TODO: Implement
 *
 * @property {Number} brightness     -
 * @property {vec4} color            -
 * @property {Number} noiseAmplitude -
 * @property {Number} noiseFrequency -
 * @property {Number} noiseOctaves   -
 * @property {vec3} position         -
 * @property {Number} radius         -
 */
export default class Tr2PointLight extends Tw2BaseClass
{

    brightness = 0;
    color = vec4.create();
    noiseAmplitude = 0;
    noiseFrequency = 0;
    noiseOctaves = 0;
    position = vec3.create();
    radius = 0;

}

Tw2BaseClass.define(Tr2PointLight, Type =>
{
    return {
        isStaging: true,
        type: "Tr2PointLight",
        props: {
            brightness: Type.NUMBER,
            color: Type.RGBA_LINEAR,
            noiseAmplitude: Type.NUMBER,
            noiseFrequency: Type.NUMBER,
            noiseOctaves: Type.NUMBER,
            position: Type.TR_TRANSLATION,
            radius: Type.NUMBER
        },
        notImplemented: [
            "brightness",
            "color",
            "noiseAmplitude",
            "noiseFrequency",
            "noiseOctaves",
            "position",
            "radius"
        ]
    };
});

