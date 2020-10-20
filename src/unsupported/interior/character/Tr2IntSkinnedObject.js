import { meta } from "utils";


@meta.notImplemented
@meta.type("Tr2IntSkinnedObject")
export class Tr2IntSkinnedObject extends meta.Model
{

    @meta.list("Tw2CurveSet")
    curveSets = [];

    @meta.struct("TriMatrix")
    transform = null;

    @meta.struct("Tr2SkinnedModel")
    visualModel = null;

}
