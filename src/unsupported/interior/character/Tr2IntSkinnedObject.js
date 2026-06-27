import { meta } from "utils";

@meta.notImplemented
@meta.type("Tr2IntSkinnedObject")
@meta.ccp.define("Tr2IntSkinnedObject")
export class Tr2IntSkinnedObject extends meta.Model
{

    @meta.rawObject()
    transform = null;

    @meta.struct()
    visualModel = null;

    @meta.list("Tw2CurveSet")
    curveSets = [];

}
