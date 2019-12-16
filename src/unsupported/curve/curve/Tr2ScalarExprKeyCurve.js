import { meta } from "global";
import { Tw2Curve, Tw2CurveKey } from "curve";


@meta.type("Tr2ScalarExprKey", true)
export class Tr2ScalarExprKey extends Tw2CurveKey
{

    @meta.black.float
    input1 = -1;

    @meta.black.float
    input2 = -1;

    @meta.black.float
    input3 = -1;

    @meta.black.uint
    interpolation = 0;

    @meta.black.float
    left = 0;

    @meta.black.float
    right = 0;

    @meta.black.float
    time = 0;

    @meta.black.expression
    timeExpression = "";

    @meta.black.float
    @meta.isPrivate
    value = 0;

}


@meta.notImplemented
@meta.type("Tr2ScalarExprKeyCurve", true)
export class Tr2ScalarExprKeyCurve extends Tw2Curve
{

    @meta.black.string
    name = "";

    @meta.black.uint
    interpolation = 0;

    @meta.black.listOf("Tr2ScalarExprKey")
    keys = [];

}
