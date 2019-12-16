import { meta } from "global";
import { Tw2Action } from "./Tw2Action";


@meta.notImplemented
@meta.type("Tr2ActionPlayCurveSet", true)
export class Tr2ActionPlayCurveSet extends Tw2Action
{

    @meta.black.string
    curveSetName = "";

    @meta.black.string
    rangeName = "";

    @meta.black.boolean
    syncToRange = false;

}
