import { meta, Tw2BaseClass } from "global";


/**
 * Tr2InteriorScene
 *
 * @property {Array.<Tr2IntSkinnedObject>} dynamics  -
 * @property {Array.<Tr2InteriorLightSource>} lights -
 */
@meta.ccp("Tr2InteriorScene")
@meta.notImplemented
export class Tr2InteriorScene extends Tw2BaseClass
{

    @meta.black.list
    dynamics = [];

    @meta.black.list
    lights = [];

}
