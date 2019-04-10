/**
 * Tr2ScalarExprKeyCurve
 * @ccp Tr2ScalarExprKeyCurve
 *
 * @property {String} name                  -
 * @property {Number} interpolation         -
 * @property {Array<Tr2ScalarExprKey>} keys -
 */
export class Tr2ScalarExprKeyCurve
{

    name = "";
    interpolation = 0;
    keys = [];

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            ["interpolation", r.uint],
            ["keys", r.array],
            ["name", r.string],
        ];
    }

    /**
     * Identifies that the class is in staging
     * @property {null|Number}
     */
    static __isStaging = 4;

}