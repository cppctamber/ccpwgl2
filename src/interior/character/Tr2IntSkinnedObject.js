import { meta, Tw2BaseClass } from "global";


/**
 * Tr2IntSkinnedObject
 *
 * @property {Array.<Tw2CurveSet>} curveSets -
 * @property {TriMatrix} transform           -
 * @property {Tr2SkinnedModel} visualModel   -
 */
@meta.ccp("Tr2IntSkinnedObject")
@meta.notImplemented
export class Tr2IntSkinnedObject extends Tw2BaseClass
{

    @meta.black.list
    curveSets = [];

    @meta.black.object
    transform = null;

    @meta.black.object
    visualModel = null;

}
