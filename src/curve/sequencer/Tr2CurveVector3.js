import {Tw2BaseClass} from "../../global/index";

/**
 * Tr2CurveVector3
 *
 * @property {String} name      -
 * @property {Tr2CurveScalar} x -
 * @property {Tr2CurveScalar} y -
 * @property {Tr2CurveScalar} z -
 */
export class Tr2CurveVector3 extends Tw2BaseClass
{

    name = "";
    x = null;
    y = null;
    z = null;

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            ["name", r.string],
            ["x", r.object],
            ["y", r.object],
            ["z", r.object]
        ];
    }

    /**
     * Identifies that the class is in staging
     * @property {null|Number}
     */
    static __isStaging = 4;

}
