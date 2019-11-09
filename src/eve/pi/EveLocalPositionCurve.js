import { vec3, Tw2BaseClass } from "global";

/**
 * EveLocalPositionCurve
 * @ccp EveLocalPositionCurve
 * TODO: Implement
 *
 * @property {vec3} value -
 */
export class EveLocalPositionCurve extends Tw2BaseClass
{

    value = vec3.create();

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            [ "value", r.vector3 ]
        ];
    }

    /**
     * Identifies that the class is in staging
     * @property {null|Number}
     */
    static __isStaging = 3;

}
