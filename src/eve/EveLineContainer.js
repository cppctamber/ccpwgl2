import { Tw2BaseClass } from "../global";

/**
 * EveLineContainer
 * @ccp EveLineContainer
 * TODO: Implement
 *
 * @property {EveCurveLineSet} lineSet -
 */
export class EveLineContainer extends Tw2BaseClass
{

    lineSet = null;


    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            [ "lineSet", r.object ]
        ];
    }

    /**
     * Identifies that the class is in staging
     * @property {null|Number}
     */
    static __isStaging = 4;

}
