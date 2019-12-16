import { meta, vec3, vec4, Tw2BaseClass } from "global";

/**
 * Tr2PointLight
 * TODO: Implement
 *
 * @property {String} name           -
 * @property {Number} brightness     -
 * @property {vec4} color            -
 * @property {Number} noiseAmplitude -
 * @property {Number} noiseFrequency -
 * @property {Number} noiseOctaves   -
 * @property {vec3} position         -
 * @property {Number} radius         -
 */
@meta.data({
    ccp: "Tr2PointLight",
    notImplemented: true
})
export class Tr2PointLight extends Tw2BaseClass
{

    @meta.black.string
    name = "";

    @meta.black.float
    brightness = 0;

    @meta.black.color
    color = vec4.create();

    @meta.black.float
    innerRadius = 0;

    @meta.black.float
    noiseAmplitude = 0;

    @meta.black.float
    noiseFrequency = 0;

    @meta.black.float
    noiseOctaves = 0;

    @meta.black.vector3
    position = vec3.create();

    @meta.black.float
    radius = 0;

}
