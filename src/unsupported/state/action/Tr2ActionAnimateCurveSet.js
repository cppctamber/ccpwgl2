import { meta } from "global";
import { Tw2Action } from "./Tw2Action";


@meta.notImplemented
@meta.type("Tr2ActionAnimateCurveSet", true)
export class Tr2ActionAnimateCurveSet extends Tw2Action
{

    @meta.black.objectOf("Tw2CurveSet")
    curveSet = null;

    @meta.black.string
    value = "";

}
