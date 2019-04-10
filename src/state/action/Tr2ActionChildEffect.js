import {Tw2BaseClass} from "../../global";

/**
 * Tr2ActionChildEffect
 * Todo: Implement
 *
 * @property {String} childName     -
 * @property {String} path          -
 * @property {Boolean} removeOnStop -
 */
export class Tr2ActionChildEffect extends Tw2BaseClass
{

    childName = "";
    path = "";
    removeOnStop = false;

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            ["childName", r.string],
            ["path", r.string],
            ["removeOnStop", r.boolean]
        ];
    }

    /**
     * Identifies that the class is in staging
     * @property {null|Number}
     */
    static __isStaging = 4;

}
