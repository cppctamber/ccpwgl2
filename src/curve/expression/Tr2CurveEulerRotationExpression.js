import {Tw2BaseClass} from "../../global";

/**
 * Tr2CurveEulerRotationExpression
 *
 * @property {String} name                          -
 * @property {String} expressionPitch               -
 * @property {String} expressionRoll                -
 * @property {String} expressionYaw                 -
 * @property {Array.<Curve|CurveExpression>} inputs -
 */
export class Tr2CurveEulerRotationExpression extends Tw2BaseClass
{

    name = "";
    expressionPitch = "";
    expressionRoll = "";
    expressionYaw = "";
    inputs = [];

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            ["inputs", r.array],
            ["name", r.string],
            ["expressionYaw", r.string],
            ["expressionPitch", r.string],
            ["expressionRoll", r.string],
        ];
    }

    /**
     * Identifies that the class is in staging
     * @property {null|Number}
     */
    static __isStaging = 4;

}