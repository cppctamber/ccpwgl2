import {Tw2BaseClass} from "../../global";

/**
 * Tr2BoneMatrixCurve
 * TODO: Implement
 *
 * @property {String} name
 */
export class Tr2BoneMatrixCurve extends Tw2BaseClass
{

    name = "";

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            ["name", r.string]
        ];
    }

    /**
     * Identifies that the class is in staging
     * @property {null|Number}
     */
    static __isStaging = 4;

}