/**
 * Tr2CurveColor
 * TODO: Implement
 * @ccp Tr2CurveColor
 *
 * @property {String} name
 * @property {Tr2CurveScalar} r
 * @property {Tr2CurveScalar} g
 * @property {Tr2CurveScalar} b
 * @property {Tr2CurveScalar} a
 */
export class Tr2CurveColor
{

    name = "";
    r = null;
    g = null;
    b = null;
    a = null;

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            ["name", r.string],
            ["r", r.object],
            ["g", r.object],
            ["b", r.object],
            ["a", r.object]
        ];
    }

    /**
     * Identifies that the class is in staging
     * @property {null|Number}
     */
    static __isStaging = 4;

}