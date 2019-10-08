import { vec3, vec4, quat } from "../../global";

/**
 * EveSOFDataHullLightSetSpotLight
 * @ccp EveSOFDataHullLightSetSpotLight
 *
 * @property {String} name
 * @property {Number} brightness
 * @property {Number} innerAngle
 * @property {Number} innerRadius
 * @property {vec4} lightColor
 * @property {Number} outerAngle
 * @property {vec3} position
 * @property {Number} radius
 * @property {quat} rotation
 */
export class EveSOFDataHullLightSetSpotLight
{

    name = "";
    brightness = 0;
    innerAngle = 0;
    innerRadius = 0;
    lightColor = vec4.create();
    outerAngle = 0;
    position = vec3.create();
    radius = 0;
    rotation = quat.create();

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
            [ "innerAngle", r.float ],
            [ "innerRadius", r.float ],
            [ "lightColor", r.color ],
            [ "outerAngle", r.float ],
            [ "position", r.vector3 ],
            [ "radius", r.uint ],
            [ "rotation", r.vector4 ]
        ];
    }
}
