import { meta } from "global";
import { Tw2Action } from "./Tw2Action";


@meta.notImplemented
@meta.ctor("Tr2ActionAnimateCurveSet")
export class Tr2ActionAnimateCurveSet extends Tw2Action
{

    @meta.struct("Tw2CurveSet")
    curveSet = null;

    @meta.string
    value = "";

}
