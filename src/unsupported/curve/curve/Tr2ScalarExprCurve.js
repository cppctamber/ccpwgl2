import { Tw2Curve } from "curve/curve";
import { meta } from "utils";


@meta.type("Tr2ScalarExprCurve")
@meta.notImplemented
export class Tr2ScalarExprCurve extends Tw2Curve
{

    @meta.float
    input1 = 0;

    @meta.float
    input2 = 0;

    @meta.float
    input3 = 0;

    @meta.float
    @meta.isPrivate
    value = 0;

    @meta.float
    @meta.isPrivate
    currentValue = 0;

    @meta.uint
    cycle = 0;

    @meta.uint
    @meta.isPrivate
    length = 0;

    @meta.string
    name = "";

    @meta.expression
    expr = "";

}
