import { Tw2BaseClass } from "global";

/**
 * Tr2Texture2dLodParameter
 * TODO: Implement
 *
 * @property {String} name                -
 * @property {Tw2LodResource} lodResource -
 */
export class Tr2Texture2dLodParameter extends Tw2BaseClass
{

    name = "";
    lodResource = null;

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            [ "name", r.string ],
            [ "lodResource", r.object ],
        ];
    }

    /**
     * Identifies that the class is in staging
     * @property {null|Number}
     */
    static __isStaging = 4;

}
