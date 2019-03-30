import {EveSOFBaseClass} from "../EveSOFBaseClass";
import { vec3, vec4, quat } from "../../global";

/**
 * EveSOFDataHullLightSetSpotLight
 * @ccp EveSOFDataHullLightSetSpotLight
 *
 * @property {String} name
 * @property {Number} brightness
 * @property {Number} innerAngle
 * @property {vec4} lightColor
 * @property {Number} outerAngle
 * @property {vec3} position
 * @property {quat} rotation
 */
export class EveSOFDataHullLightSetSpotLight extends EveSOFBaseClass
{

    name = "";
    brightness = 0;
    innerAngle = 0;
    lightColor = vec4.create();
    outerAngle = 0;
    position = vec3.create();
    rotation = quat.create();

}

EveSOFDataHullLightSetSpotLight.define(r =>
{
    return {
        type: "EveSOFDataHullLightSetSpotLight",
        black: [
            ["name", r.string],
            ["brightness", r.float],
            ["innerAngle", r.float],
            ["lightColor", r.color],
            ["outerAngle", r.float],
            ["position", r.vector3],
            ["rotation", r.vector4],
        ]
    };
});