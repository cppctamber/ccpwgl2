import { vec3, vec4, Tw2BaseClass } from "../../global";

/**
 * EveConnector
 * @ccp EveConnector
 * Todo: Implement
 *
 * @property {vec4} animationColor                -
 * @property {Number} animationScale              -
 * @property {Number} animationSpeed              -
 * @property {vec4} color                         -
 * @property {EveLocalPositionCurve} destObject   -
 * @property {vec3} destPosition                  -
 * @property {Boolean} isAnimated                 -
 * @property {Number} lineWidth                   -
 * @property {EveLocalPositionCurve} sourceObject -
 * @property {Number} type                        -
 */
export class EveConnector extends Tw2BaseClass
{

    animationColor = vec4.create();
    animationScale = 0;
    animationSpeed = 0;
    color = vec4.create();
    destObject = null;
    destPosition = vec3.create();
    isAnimated = false;
    lineWidth = 0;
    sourceObject = null;
    type = 0;

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            [ "animationColor", r.color ],
            [ "animationScale", r.float ],
            [ "animationSpeed", r.float ],
            [ "color", r.color ],
            [ "destObject", r.object ],
            [ "destPosition", r.vector3 ],
            [ "isAnimated", r.boolean ],
            [ "lineWidth", r.float ],
            [ "sourceObject", r.object ],
            [ "sourcePosition", r.vector3 ],
            [ "type", r.uint ],
        ];
    }

    /**
     * Identifies that the class is in staging
     * @property {null|Number}
     */
    static __isStaging = 4;

}
