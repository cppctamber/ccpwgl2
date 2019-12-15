import { meta, Tw2BaseClass } from "global";


@meta.notImplemented
@meta.type("Tr2IntSkinnedObject", true)
export class Tr2IntSkinnedObject extends Tw2BaseClass
{

    @meta.black.listOf("Tw2CurveSet")
    curveSets = [];

    @meta.black.objectOf("TriMatrix")
    transform = null;

    @meta.black.objectOf("Tr2SkinnedModel")
    visualModel = null;

}
