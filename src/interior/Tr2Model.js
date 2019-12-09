import { meta, Tw2BaseClass } from "global";


/**
 * Tw2InteriorModel
 * - Note that the class Tw2Model name is already used as a ccpwgl class elsewhere
 *
 * @property {Array.<Tw2Mesh>} meshes -
 */
@meta.ccp("Tr2Model")
@meta.notImplemented
export class Tr2Model extends Tw2BaseClass
{

    @meta.black.list
    meshes = [];

}
