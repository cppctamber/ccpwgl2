import {EveSOFBaseClass} from "../EveSOFBaseClass";
import {vec3} from "../../global";

/**
 * EveSOFDataHullLightSetTexturedPointLight
 * @ccp EveSOFDataHullLightSetTexturedPointLight
 *
 * @property {String} name
 * @property {Number} brightness
 * @property {vec3} position
 * @property {Number} radius
 * @property {String} texturePath
 */
export class EveSOFDataHullLightSetTexturedPointLight extends EveSOFBaseClass
{

    name = "";
    brightness = 0;
    innerRadius = 0;
    position = vec3.create();
    radius = 0;
    texturePath = "";

}

EveSOFDataHullLightSetTexturedPointLight.define(r =>
{
    return {
        type: "EveSOFDataHullLightSetTexturedPointLight",
        black: [
            ["name", r.string],
            ["brightness", r.float],
            ["innerRadius", r.float],
            ["position", r.vector3],
            ["radius", r.float],
            ["texturePath", r.path]
        ]
    };
});