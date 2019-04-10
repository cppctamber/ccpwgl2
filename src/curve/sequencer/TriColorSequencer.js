import {vec4} from "../../global/index";
import {Tw2BaseClass} from "../../global/index";

/**
 * TriColorSequencer
 *
 * @property {String} name                             -
 * @property {Array.<Curve|CurveExpression>} functions -
 * @property {vec4} value                              -
 */
export class TriColorSequencer extends Tw2BaseClass
{

    name = "";
    functions = [];
    value = vec4.create();

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            ["functions", r.array],
            ["name", r.string],
            ["value", r.vector4]
        ];
    }

    /**
     * Identifies that the class is in staging
     * @property {null|Number}
     */
    static __isStaging = 4;

}