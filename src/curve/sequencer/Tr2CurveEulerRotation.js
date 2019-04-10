import {Tw2BaseClass} from "../../global/index";

/**
 * Tr2CurveEulerRotation
 *
 * @property {String} name          -
 * @property {Tr2CurveScalar} pitch -
 * @property {Tr2CurveScalar} roll  -
 * @property {Tr2CurveScalar} yaw   -
 */
export class Tr2CurveEulerRotation extends Tw2BaseClass
{

    name = "";
    pitch = null;
    roll = null;
    yaw = null;

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            ["name", r.string],
            ["pitch", r.object],
            ["roll", r.object],
            ["yaw", r.object]
        ];
    }

    /**
     * Identifies that the class is in staging
     * @property {null|Number}
     */
    static __isStaging = 4;

}
