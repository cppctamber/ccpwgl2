import { meta } from "utils";
import { Tw2Action } from "./Tw2Action";


@meta.notImplemented
@meta.ctor("Tr2ActionPlayCurveSet")
export class Tr2ActionPlayCurveSet extends Tw2Action
{

    @meta.string
    curveSetName = "";

    @meta.string
    rangeName = "";

    @meta.boolean
    syncToRange = false;

}
