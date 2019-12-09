import { meta, Tw2BaseClass } from "global";


/**
 * Tr2SkinnedModel
 *
 * @property {String} name            -
 * @property {String} geometryResPath -
 * @property {Array}  meshes          -
 * @property {String} skeletonName    -
 */
@meta.ccp("Tr2SkinnedModel")
@meta.notImplemented
export class Tr2SkinnedModel extends Tw2BaseClass
{

    @meta.black.string
    name = "";

    @meta.black.path
    geometryResPath = "";

    @meta.black.list
    meshes = [];

    @meta.black.string
    skeletonName = "";

}
