import {vec3, vec4} from "../../global";


/**
 * EveSOFDataHullLightSetItem
 * @ccp EveSOFDataHullLightSetItem
 *
 * @property {String} name
 * @property {Number} brightness
 * @property {Number} innerRadius
 * @property {vec4} lightColor
 * @property {vec3} position
 * @property {Number} radius
 */
export class EveSOFDataHullLightSetItem
{

    name = "";
    brightness = 0;
    innerRadius = 0;
    lightColor = vec4.create();
    noiseAmplitude = 0;
    noiseFrequency = 0;
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
            ["name", r.string],
            ["brightness", r.float],
            ["innerRadius", r.float],
            ["lightColor", r.vector4],
            ["noiseAmplitude", r.float],
            ["noiseFrequency", r.float],
            ["position", r.vector3],
            ["radius", r.float],
        ];
    }
}