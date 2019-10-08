import { Tw2BaseClass } from "../global";

/**
 * Tr2Model
 * TODO: The ccpwgl class Tw2Model is for a different purpose than this one...
 * @ccp Tr2Model
 *
 * @property {Array.<Tr2Mesh>} meshes -
 */
export class Tr2Model extends Tw2BaseClass
{

    meshes = [];

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            [ "meshes", r.array ],
        ];
    }

    /**
     * Identifies that the class is in staging
     * @property {null|Number}
     */
    static __isStaging = 4;

}
