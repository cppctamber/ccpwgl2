import {Tw2BaseClass} from "../../global";

/**
 * Tr2ActionPlayCurveSet
 * @implements StateAction
 * Todo: Implement
 *
 * @property {String} curveSetName -
 * @property {String} rangeName    -
 * @property {Boolean} syncToRange -
 */
export class Tr2ActionPlayCurveSet extends Tw2BaseClass
{

    curveSetName = "";
    rangeName = "";
    syncToRange = false;

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            ["curveSetName", r.string],
            ["rangeName", r.string],
            ["syncToRange", r.boolean]
        ];
    }

    /**
     * Identifies that the class is in staging
     * @property {null|Number}
     */
    static __isStaging = 4;

}
