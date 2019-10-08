import { Tw2BaseClass } from "../../global";

/**
 * Tr2ShLightingManager
 * TODO: Implement
 *
 * @property {Number} primaryIntensity   -
 * @property {Number} secondaryIntensity -
 */
export class Tr2ShLightingManager extends Tw2BaseClass
{

    primaryIntensity = 0;
    secondaryIntensity = 0;

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            [ "primaryIntensity", r.float ],
            [ "secondaryIntensity", r.float ]
        ];
    }

    /**
     * Identifies that the class is in staging
     * @property {null|Number}
     */
    static __isStaging = 4;

}
