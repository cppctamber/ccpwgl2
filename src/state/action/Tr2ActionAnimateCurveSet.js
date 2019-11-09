import { Tw2BaseClass } from "global";

/**
 * Tr2ActionAnimateCurveSet
 * TODO: Implement
 *
 * @property {Tw2CurveSet} curveSet -
 * @property {String} value         -
 */
export class Tr2ActionAnimateCurveSet extends Tw2BaseClass
{

    curveSet = null;
    value = "";

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            [ "curveSet", r.object ],
            [ "value", r.string ]
        ];
    }

    /**
     * Identifies that the class is in staging
     * @property {null|Number}
     */
    static __isStaging = 4;

}
