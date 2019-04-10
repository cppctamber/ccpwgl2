import {Tw2BaseClass} from "../../global/index";

/**
 * TriPerlinCurve
 *
 * @property {String} name   -
 * @property {Number} N      -
 * @property {Number} alpha  -
 * @property {Number} beta   -
 * @property {Number} offset -
 * @property {Number} scale  -
 * @property {Number} speed  -
 * @property {Number} value  -
 */
export class TriPerlinCurve extends Tw2BaseClass
{

    name = "";
    N = 0;
    alpha = 0;
    beta = 0;
    offset = 0;
    scale = 0;
    speed = 0;
    value = 0;

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            ["alpha", r.float],
            ["beta", r.float],
            ["N", r.uint],
            ["name", r.string],
            ["offset", r.float],
            ["scale", r.float],
            ["speed", r.float],
            ["value", r.float]
        ];
    }

    /**
     * Identifies that the class is in staging
     * @property {null|Number}
     */
    static __isStaging = 4;

}