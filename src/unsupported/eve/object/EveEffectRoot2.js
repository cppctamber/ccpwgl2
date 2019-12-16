import { quat, vec3, vec4 } from "global";
import { EveObject } from "eve/object/EveObject";


/**
 * EveEffectRoot2
 * TODO: Implement
 * @ccp EveEffectRoot2
 *
 * @property {String} name                          -
 * @property {vec3} boundingSphereCenter            -
 * @property {Number} boundingSphereRadius          -
 * @property {Array.<Tw2CurveSet>} curveSets        -
 * @property {Number} duration                      -
 * @property {Boolean} dynamicLOD                   -
 * @property {Array.<EveChild>} effectChildren      -
 * @property {Array.<Tr2PointLight>} lights         -
 * @property {Array} observers                      -
 * @property {quat} rotation                        -
 * @property {vec3} scaling                         -
 * @property {vec4} secondaryLightingEmissiveColor  -
 * @property {Number} secondaryLightingSphereRadius -
 * @property {vec3} translation                     -
 */
export class EveEffectRoot2 extends EveObject
{

    name = "";
    boundingSphereCenter = vec3.create();
    boundingSphereRadius = 0;
    curveSets = [];
    duration = 0;
    dynamicLOD = false;
    effectChildren = [];
    lights = [];
    observers = [];
    rotation = quat.create();
    scaling = vec3.fromValues(1, 1, 1);
    secondaryLightingEmissiveColor = vec4.create();
    secondaryLightingSphereRadius = 0;
    translation = vec3.create();

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            [ "boundingSphereCenter", r.vector3 ],
            [ "boundingSphereRadius", r.float ],
            [ "curveSets", r.array ],
            [ "duration", r.float ],
            [ "dynamicLOD", r.boolean ],
            [ "effectChildren", r.array ],
            [ "lights", r.array ],
            [ "name", r.string ],
            [ "observers", r.array ],
            [ "rotation", r.vector4 ],
            [ "scaling", r.vector3 ],
            [ "secondaryLightingEmissiveColor", r.color ],
            [ "secondaryLightingSphereRadius", r.float ],
            [ "translation", r.vector3 ],
        ];
    }

    /**
     * Identifies that the class is in staging
     * @property {null|Number}
     */
    static __isStaging = 4;

}
