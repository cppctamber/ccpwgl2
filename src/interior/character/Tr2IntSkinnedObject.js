import {Tw2BaseClass} from "../../global";

/**
 * Tr2IntSkinnedObject
 * TODO: Do we need this class?
 * TODO: Implement
 *
 * @property {Array.<TriCurveSet>} curveSets -
 * @property {TriMatrix} transform           -
 * @property {Tr2SkinnedModel} visualModel   -
 */
export class Tr2IntSkinnedObject extends Tw2BaseClass
{

    curveSets = [];
    transform = null;
    visualModel = null;

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            ["curveSets", r.array],
            ["transform", r.object],
            ["visualModel", r.object],
        ];
    }

    /**
     * Identifies that the class is in staging
     * @property {null|Number}
     */
    static __isStaging = 4;

}
