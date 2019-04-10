import {Tw2BaseClass} from "../../global/index";

/**
 * Tr2CurveScalarExpression
 * TODO: Implement
 *
 * @property {String} expression    -
 * @property {Number} input1        -
 * @property {Number} input2        -
 * @property {Number} input3        -
 * @property {Array.<Curve>} inputs -
 */
export class Tr2CurveScalarExpression extends Tw2BaseClass
{

    name = "";
    expression = "";
    inputs = [];
    input1 = -1; // What should be the default value?
    input2 = -1; // What should be the default value?
    input3 = -1; // What should be the default value?

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
            ["expression", r.string],
            ["input1", r.float],
            ["input2", r.float],
            ["input3", r.float],
        ];
    }

    /**
     * Identifies that the class is in staging
     * @property {null|Number}
     */
    static __isStaging = 4;

}
