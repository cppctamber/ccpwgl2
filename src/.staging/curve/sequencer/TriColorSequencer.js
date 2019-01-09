import {vec4} from "../../../global";
import {Tw2BaseClass} from "../../class";

/**
 * TriColorSequencer
 * @implements CurveSequencer
 *
 * @parameter {Array.<Curve|CurveExpression>} functions -
 * @parameter {vec4} value                              -
 */
export default class TriColorSequencer extends Tw2BaseClass
{

    functions = [];
    value = vec4.create();

}

Tw2BaseClass.define(TriColorSequencer, Type =>
{
    return {
        isStaging: true,
        type: "TriColorSequencer",
        category: "CurveSequencer",
        props: {
            functions: [["Tr2CurveColor", "Tr2CurveConstant", "Tr2CurveVector3Expression"]],
            value: Type.VECTOR4
        }
    };
});

