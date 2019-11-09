import { Tw2BaseClass } from "global";

/**
 * Tr2SkinnedModel
 * TODO: Do we need this class?
 * TODO: Implement
 *
 * @property {String} name            -
 * @property {String} geometryResPath -
 * @property {Array.<Mesh>} meshes    -
 * @property {String} skeletonName    -
 */
export class Tr2SkinnedModel extends Tw2BaseClass
{

    name = "";
    geometryResPath = "";
    meshes = [];
    skeletonName = "";

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            [ "geometryResPath", r.string ],
            [ "meshes", r.array ],
            [ "name", r.string ],
            [ "skeletonName", r.string ]
        ];
    }

    /**
     * Identifies that the class is in staging
     * @property {null|Number}
     */
    static __isStaging = 4;

}
