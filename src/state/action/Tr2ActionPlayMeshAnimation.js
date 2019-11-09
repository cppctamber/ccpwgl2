import { Tw2BaseClass } from "global";

/**
 * Tr2ActionPlayMeshAnimation
 * Todo: Implement
 *
 * @property {String} animation -
 * @property {Number} loops     -
 * @property {String} mask      -
 */
export class Tr2ActionPlayMeshAnimation extends Tw2BaseClass
{

    animation = "";
    loops = 0;
    mask = "";

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            [ "animation", r.string ],
            [ "loops", r.uint ],
            [ "mask", r.string ],
        ];
    }

    /**
     * Identifies that the class is in staging
     * @property {null|Number}
     */
    static __isStaging = 4;

}
