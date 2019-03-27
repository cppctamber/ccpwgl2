import {vec3, vec4} from "../../global";
import {EveSOFBaseClass} from "../EveSOFBaseClass";

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
export class EveSOFDataHullLightSetItem extends EveSOFBaseClass
{

    name = "";
    brightness = 0;
    innerRadius = 0;
    lightColor = vec4.create();
    position = vec3.create();
    radius = 0;

}

EveSOFDataHullLightSetItem.define(r =>
{
    return {
        type: "EveSOFDataHullLightSetItem",
        black: [
            ["name", r.string],
            ["brightness", r.float],
            ["innerRadius", r.float],
            ["lightColor", r.vector4],
            ["position", r.vector3],
            ["radius", r.float]
        ]
    };
});