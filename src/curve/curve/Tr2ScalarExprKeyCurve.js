import { meta } from "global";
import { Tw2Curve, Tw2CurveKey } from "./Tw2Curve";

/**
 * Tr2ScalarExprKey
 *
 * @property {Number} input1
 * @property {Number} input2
 * @property {Number} input3
 * @property {Number} interpolation
 * @property {Number} left
 * @property {Number} right
 * @property {Number} time
 * @property {String} timeExpression
 * @property {Number} value
 */
@meta.notImplemented
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


/**
 * Tr2ScalarExprKeyCurve
 * @ccp Tr2ScalarExprKeyCurve
 *
 * @property {String} name                  -
 * @property {Number} interpolation         -
 * @property {Array<Tr2ScalarExprKey>} keys -
 */
@meta.notImplemented
@meta.type("Tr2ScalarExprKeyCurve", true)
export class Tr2ScalarExprKeyCurve extends Tw2Curve
{

    @meta.black.string
    name = "";

    @meta.black.uint
    interpolation = 0;

    @meta.black.list
    keys = [];

}
