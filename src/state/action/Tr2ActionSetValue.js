import {Tw2BaseClass} from "../../global";

/**
 * Tr2ActionSetValue
 * Todo: Implement
 *
 * @property {String} attribute -
 * @property {String} path      -
 * @property {String} value     -
 */
export class Tr2ActionSetValue extends Tw2BaseClass
{

    attribute = "";
    path = "";
    value = "";

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            ["attribute", r.string],
            ["path", r.string],
            ["value", r.string]
        ];
    }

    /**
     * Identifies that the class is in staging
     * @property {null|Number}
     */
    static __isStaging = 4;

}
