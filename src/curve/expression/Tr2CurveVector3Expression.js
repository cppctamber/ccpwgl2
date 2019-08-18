import {Tw2BaseClass} from "../../global/index";
import {Tw2CurveExpression} from "./Tw2CurveExpression";

/**
 * Tr2CurveVector3Expression
 * TODO: Implement
 *
 * @property {String} expressionX                         -
 * @property {String} expressionY                         -
 * @property {String} expressionZ                         -
 */
export class Tr2CurveVector3Expression extends Tw2CurveExpression
{

    expressionX = "";
    expressionY = "";
    expressionZ = "";


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
            ["expressionX", r.string],
            ["expressionY", r.string],
            ["expressionZ", r.string]
        ];
    }

    /**
     * Identifies that the class is in staging
     * @property {null|Number}
     */
    static __isStaging = 4;

}
