import { meta, Tw2BaseClass } from "global";

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
@meta.notImplemented
@meta.type("EveStarfield", true)
export class EveStarfield extends Tw2BaseClass
{

    @meta.black.object
    effect = null;

    @meta.black.float
    maxDist = 0;

    @meta.black.float
    maxFlashRate = 0;

    @meta.black.float
    minDist = 0;

    @meta.black.float
    minFlashIntensity = 0;

    @meta.black.float
    minFlashRate = 0;

    @meta.black.uint
    numStars = 0;

    @meta.black.uint
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
