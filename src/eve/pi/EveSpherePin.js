import { vec3, vec4, Tw2BaseClass } from "global";

/**
 * EveSpherePin
 * @ccp EveSpherePin
 * TODO: Implement
 *
 * @property {String} name                   -
 * @property {vec3} centerNormal             -
 * @property {vec4} color                    -
 * @property {Array.<Tw2CurveSet>} curveSets -
 * @property {Boolean} enablePicking         -
 * @property {String} geometryResPath        -
 * @property {vec4} pinColor                 -
 * @property {Tw2Effect} pinEffect           -
 * @property {Number} pinMaxRadius           -
 * @property {Number} pinRadius              -
 * @property {Number} pinRotation            -
 * @property {Number} sortValueMultiplier    -
 */
export class EveSpherePin extends Tw2BaseClass
{

    name = "";
    centerNormal = vec3.create();
    color = vec4.create();
    curveSets = [];
    enablePicking = false;
    geometryResPath = "";
    pinColor = vec4.create();
    pinEffect = null;
    pinMaxRadius = 0;
    pinRadius = 0;
    pinRotation = 0;
    sortValueMultiplier = 0;

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            [ "centerNormal", r.vector3 ],
            [ "color", r.color ],
            [ "curveSets", r.array ],
            [ "enablePicking", r.boolean ],
            [ "geometryResPath", r.path ],
            [ "name", r.string ],
            [ "pinColor", r.color ],
            [ "pinEffect", r.object ],
            [ "pinMaxRadius", r.float ],
            [ "pinRadius", r.float ],
            [ "pinRotation", r.float ],
            [ "sortValueMultiplier", r.float ]
        ];
    }

    /**
     * Identifies that the class is in staging
     * @property {null|Number}
     */
    static __isStaging = 4;

}
