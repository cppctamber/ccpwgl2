import { vec3, vec4 } from "global";
import { Tw2BaseClass } from "global";

/**
 * Tr2InteriorLightSource
 * TODO: Do we need this class?
 * TODO: Implement
 *
 * @property {String} name                -
 * @property {vec4} color                 -
 * @property {Number} coneAlphaInner      -
 * @property {Number} coneAlphaOuter      -
 * @property {vec3} coneDirection         -
 * @property {Number} falloff             -
 * @property {Number} importanceBias      -
 * @property {Number} importanceScale     -
 * @property {Tr2KelvinColor} kelvinColor -
 * @property {vec3} position              -
 * @property {Number} radius              -
 * @property {Boolean} useKelvinColor     -
 */
export class Tr2InteriorLightSource extends Tw2BaseClass
{

    name = "";
    color = vec4.create();
    coneAlphaInner = 0;
    coneAlphaOuter = 0;
    coneDirection = vec3.create();
    falloff = 0;
    importanceBias = 0;
    importanceScale = 0;
    kelvinColor = null;
    position = vec3.create();
    radius = 0;
    useKelvinColor = false;

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            [ "color", r.vector4 ],
            [ "coneAlphaInner", r.float ],
            [ "coneAlphaOuter", r.float ],
            [ "coneDirection", r.vector3 ],
            [ "falloff", r.float ],
            [ "importanceBias", r.float ],
            [ "importanceScale", r.float ],
            [ "kelvinColor", r.object ],
            [ "name", r.string ],
            [ "position", r.vector3 ],
            [ "radius", r.float ],
            [ "useKelvinColor", r.boolean ],
        ];
    }

    /**
     * Identifies that the class is in staging
     * @property {null|Number}
     */
    static __isStaging = 4;

}
