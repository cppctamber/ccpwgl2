/**
 * Tr2ScalarExprKey
 * TODO: Implement
 * @ccp Tr2ScalarExprKey
 *
 * @property {Number} input1
 * @property {Number} input2
 * @property {Number} input3
 * @property {Number} interpolation
 * @property {Number} left
 * @property {Number} right
 * @property {Number} time
 * @property {String} timeExpression
 * @property {Number} value
 */
export class Tr2ScalarExprKey
{

    input1 = -1;
    input2 = -1;
    input3 = -1;
    interpolation = 0;
    left = 0;
    right = 0;
    time = 0;
    timeExpression = "";
    value = 0;

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            ["input1", r.float],
            ["input2", r.float],
            ["input3", r.float],
            ["interpolation", r.uint],
            ["left", r.float],
            ["right", r.float],
            ["time", r.float],
            ["timeExpression", r.string],
            ["value", r.float],
        ];
    }

    /**
     * Identifies that the class is in staging
     * @property {null|Number}
     */
    static __isStaging = 4;

}