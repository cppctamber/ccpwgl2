import { meta } from "global";
import { Tw2Action } from "./Tw2Action";


@meta.notImplemented
@meta.type("Tr2ActionAnimateValue", true)
export class Tr2ActionAnimateValue extends Tw2Action
{

    @meta.black.string
    attribute = "";

    @meta.black.objectOf("Tr2CurveScalarExpression")
    curve = null;

    @meta.black.path
    path = "";

    @meta.black.string
    value = "";

}
