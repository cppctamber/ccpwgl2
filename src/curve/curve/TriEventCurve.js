import {Tw2BaseClass} from "../../global/index";


/**
 * TriEventKey
 * @implements CurveKey
 *
 * @property {Number} time  -
 * @property {Number} value -
 */
export class TriEventKey extends Tw2BaseClass
{

    time = 0;
    value = 0;

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            ["time", r.float],
            ["value", r.ushort]
        ];
    }

}

/**
 * TriEventCurve
 *
 * @property {String} name           -
 * @property {Number} extrapolation  -
 * @property {Array.<CurveKey>} keys -
 * @property {Number} value          -
 */
export class TriEventCurve extends Tw2BaseClass
{

    name = "";
    extrapolation = 0;
    keys = [];
    value = 0;

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            ["extrapolation", r.uint],
            ["name", r.string],
            ["keys", r.array],
            ["value", r.ushort]
        ];
    }

    /**
     * Identifies that the class is in staging
     * @property {null|Number}
     */
    static __isStaging = 4;

}
