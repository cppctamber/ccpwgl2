import { meta } from "utils";
import { Tw2Curve, Tw2CurveKey } from "curve";


@meta.ctor("Tr2ScalarExprKey")
export class Tr2ScalarExprKey extends Tw2CurveKey
{

    @meta.float
    input1 = -1;

    @meta.float
    input2 = -1;

    @meta.float
    input3 = -1;

    @meta.uint
    interpolation = 0;

    @meta.float
    left = 0;

    @meta.float
    right = 0;

    @meta.float
    time = 0;

    @meta.expression
    timeExpression = "";

    @meta.float
    @meta.isPrivate
    value = 0;

}


@meta.notImplemented
@meta.ctor("Tr2ScalarExprKeyCurve")
export class Tr2ScalarExprKeyCurve extends Tw2Curve
{

    @meta.string
    name = "";

    @meta.uint
    interpolation = 0;

    @meta.list("Tr2ScalarExprKey")
    keys = [];

    @meta.float
    currentValue = 0;

}
