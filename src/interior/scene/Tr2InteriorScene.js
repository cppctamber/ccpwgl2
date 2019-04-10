import {Tw2BaseClass} from "../../global";

/**
 * Tr2InteriorScene
 * TODO: Do we need this class?
 * TODO: Implement
 *
 * @property {Array.<Tr2IntSkinnedObject>} dynamics  -
 * @property {Array.<Tr2InteriorLightSource>} lights -
 */
export class Tr2InteriorScene extends Tw2BaseClass
{

    dynamics = [];
    lights = [];

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            ["dynamics", r.array],
            ["lights", r.array]
        ];
    }

    /**
     * Identifies that the class is in staging
     * @property {null|Number}
     */
    static __isStaging = 4;

}
