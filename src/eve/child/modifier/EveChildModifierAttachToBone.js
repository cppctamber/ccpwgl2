import {Tw2BaseClass} from "../../../global";

/**
 * EveChildModifierAttachToBone
 * TODO: Do we just implement this as an EveChild modifier mode?
 *
 * @property {Number} boneIndex -
 */
export class EveChildModifierAttachToBone extends Tw2BaseClass
{

    boneIndex = -1;

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            ["boneIndex", r.uint]
        ];
    }

    /**
     * Identifies that the class is in staging
     * @property {null|Number}
     */
    static __isStaging = 4;

}