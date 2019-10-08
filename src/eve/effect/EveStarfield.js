import { Tw2BaseClass } from "../../global/index";

/**
 * EveStarfield
 * TODO: Implement
 *
 * @property {Tw2Effect} effect         -
 * @property {Number} maxDist           -
 * @property {Number} maxFlashRate      -
 * @property {Number} minDist           -
 * @property {Number} minFlashIntensity -
 * @property {Number} minFlashRate      -
 * @property {Number} numStars          -
 * @property {Number} seed              -
 */
export class EveStarfield extends Tw2BaseClass
{

    effect = null;
    maxDist = 0;
    maxFlashRate = 0;
    minDist = 0;
    minFlashIntensity = 0;
    minFlashRate = 0;
    numStars = 0;
    seed = 0;

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            [ "effect", r.object ],
            [ "maxDist", r.float ],
            [ "maxFlashRate", r.float ],
            [ "minDist", r.float ],
            [ "minFlashIntensity", r.float ],
            [ "minFlashRate", r.float ],
            [ "numStars", r.uint ],
            [ "seed", r.uint ]
        ];
    }

    /**
     * Identifies that the class is in staging
     * @property {null|Number}
     */
    static __isStaging = 4;

}
