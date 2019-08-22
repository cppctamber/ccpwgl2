import {Tw2BaseClass} from "../../global";

/**
 * Tr2InteriorPlaceable
 * TODO: Do we need this class?
 * TODO: Implement
 *
 * @property {String} placeableResPath -
 * @property {TriMatrix} transform     -
 */
export class Tr2InteriorPlaceable extends Tw2BaseClass
{

    placeableResPath = "";
    transform = null;

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            ["placeableResPath", r.path],
            ["transform", r.object]
        ];
    }

    /**
     * Identifies that the class is in staging
     * @property {null|Number}
     */
    static __isStaging = 4;

}