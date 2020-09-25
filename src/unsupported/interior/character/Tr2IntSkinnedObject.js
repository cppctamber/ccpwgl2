import { meta, Tw2BaseClass } from "global";


@meta.notImplemented
@meta.ctor("Tr2IntSkinnedObject")
export class Tr2IntSkinnedObject extends Tw2BaseClass
{

    @meta.list("Tw2CurveSet")
    curveSets = [];

    @meta.struct("TriMatrix")
    transform = null;

    @meta.struct("Tr2SkinnedModel")
    visualModel = null;

}
