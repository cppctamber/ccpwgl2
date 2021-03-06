import { meta } from "utils";
import { Tw2Action } from "./Tw2Action";


@meta.notImplemented
@meta.type("Tr2ActionAnimateCurveSet")
export class Tr2ActionAnimateCurveSet extends Tw2Action
{

    @meta.struct("Tw2CurveSet")
    curveSet = null;

    @meta.string
    value = "";

}
