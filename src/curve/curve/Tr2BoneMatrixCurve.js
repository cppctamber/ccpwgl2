import {Tw2Curve} from "./Tw2Curve";

/**
 * Tr2BoneMatrixCurve
 * TODO: Implement
 *
 * @property {String} name
 */
export class Tr2BoneMatrixCurve extends Tw2Curve
{

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