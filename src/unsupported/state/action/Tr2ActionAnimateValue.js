import { meta } from "utils";
import { Tw2Action } from "./Tw2Action";


@meta.notImplemented
@meta.type("Tr2ActionAnimateValue")
export class Tr2ActionAnimateValue extends Tw2Action
{

    @meta.string
    attribute = "";

    @meta.struct("Tr2CurveScalarExpression")
    curve = null;

    @meta.path
    path = "";

    @meta.string
    value = "";

}
