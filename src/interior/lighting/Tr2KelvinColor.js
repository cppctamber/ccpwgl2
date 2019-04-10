import {Tw2BaseClass} from "../../global";

/**
 * Tr2KelvinColor
 * TODO: Do we need this class?
 * TODO: Implement
 *
 * @property {Number} temperature -
 * @property {Number} tint        -
 */
export class Tr2KelvinColor extends Tw2BaseClass
{

    temperature = 0;
    tint = 0;

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            ["temperature", r.float],
            ["tint", r.float],
        ];
    }

    /**
     * Identifies that the class is in staging
     * @property {null|Number}
     */
    static __isStaging = 4;

}