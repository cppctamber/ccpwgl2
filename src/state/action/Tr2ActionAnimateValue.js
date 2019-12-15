import { meta, Tw2BaseClass } from "global";


/**
 * Tr2ActionAnimateValue
 *
 * @property {String} attribute               -
 * @property {Tr2CurveScalarExpression} curve -
 * @property {String} path                    -
 * @property {String} value                   -
 */
@meta.notImplemented
@meta.type("Tr2ActionAnimateValue", true)
export class Tr2ActionAnimateValue extends Tw2BaseClass
{

    @meta.black.string
    attribute = "";

    @meta.black.object
    curve = null;

    @meta.black.path
    path = "";

    @meta.black.string
    value = "";

}
