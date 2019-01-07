import {vec4} from "../../../global";
import {Tw2StagingClass} from "../../class";

/**
 * Tw2ColorSequencer
 * @ccp TriColorSequencer
 * @implements CurveSequencer
 *
 * @parameter {Array.<Curve|CurveExpression>} functions -
 * @parameter {vec4} value                              -
 */
export default class Tw2ColorSequencer extends Tw2StagingClass
{

    functions = [];
    value = vec4.create();

}

Tw2StagingClass.define(Tw2ColorSequencer, Type =>
{
    return {
        type: "Tw2ColorSequencer",
        category: "CurveSequencer",
        props: {
            functions: [["Tw2CurveColor", "Tw2CurveConstant", "Tw2CurveVector3Expression"]],
            value: Type.VECTOR4
        }
    };
});

