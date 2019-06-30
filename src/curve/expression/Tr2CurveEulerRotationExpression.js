import {Tw2CurveExpression} from "./Tw2CurveExpression";

/**
 * Tr2CurveEulerRotationExpression
 *
 * @property {String} expressionPitch                     -
 * @property {String} expressionRoll                      -
 * @property {String} expressionYaw                       -
 */
export class Tr2CurveEulerRotationExpression extends Tw2CurveExpression
{

    expressionPitch = "";
    expressionRoll = "";
    expressionYaw = "";


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