import {Tw2StagingClass} from "../../class";

/**
 * Tw2CurveScalarExpression
 * @ccp Tr2CurveScalarExpression
 * @implements CurveExpression
 *
 * @parameter {String} expression    -
 * @parameter {Number} input1        -
 * @parameter {Array.<Curve>} inputs -
 */
export default class Tw2CurveScalarExpression extends Tw2StagingClass
{

    expression = "";
    input1 = 0;
    inputs = [];

}

Tw2StagingClass.define(Tw2CurveScalarExpression, Type =>
{
    return {
        type: "Tw2CurveScalarExpression",
        category: "CurveExpression",
        props: {
            expression: Type.EXPRESSION,
            input1: Type.NUMBER,
            inputs: [["Tw2CurveScalar", "Tw2PerlinCurve"]]
        }
    };
});

