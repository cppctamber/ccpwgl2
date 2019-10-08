import { vec3, vec4, Tw2BaseClass } from "../../global";

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
export class Tr2PointLight extends Tw2BaseClass
{

    name = "";
    brightness = 0;
    color = vec4.create();
    innerRadius = 0;
    noiseAmplitude = 0;
    noiseFrequency = 0;
    noiseOctaves = 0;
    position = vec3.create();
    radius = 0;

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            [ "name", r.string ],
            [ "brightness", r.float ],
            [ "color", r.vector4 ],
            [ "innerRadius", r.float ],
            [ "noiseAmplitude", r.float ],
            [ "noiseFrequency", r.float ],
            [ "noiseOctaves", r.float ],
            [ "position", r.vector3 ],
            [ "radius", r.float ],
        ];
    }

    /**
     * Identifies that the class is in staging
     * @property {null|Number}
     */
    static __isStaging = 4;

}
