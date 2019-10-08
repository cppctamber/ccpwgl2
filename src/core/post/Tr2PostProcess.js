import { Tw2BaseClass } from "../../global";

/**
 * Tr2PostProcess
 * TODO: Implement
 *
 * @property {Array.<Tr2Effect>} stages -
 */
export class Tr2PostProcess extends Tw2BaseClass
{

    stages = [];

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            [ "stages", r.array ]
        ];
    }

    /**
     * Identifies that the class is in staging
     * @property {null|Number}
     */
    static __isStaging = 4;

}
