import {Tw2StagingClass} from "../../class";

/**
 * Tw2CurveVector3Expression
 * @ccp Tr2CurveVector3Expression
 * @implements CurveExpression
 *
 * @parameter {String} expressionX                   -
 * @parameter {String} expressionY                   -
 * @parameter {String} expressionZ                   -
 * @parameter {Array.<Curve|CurveExpression>} inputs -
 */
export default class Tw2CurveVector3Expression extends Tw2StagingClass
{

    expressionX = "";
    expressionY = "";
    expressionZ = "";
    inputs = [];

}

Tw2StagingClass.define(Tw2CurveVector3Expression, Type =>
{
    return {
        type: "Tw2CurveVector3Expression",
        category: "CurveExpression",
        props: {
            expressionX: Type.EXPRESSION,
            expressionY: Type.EXPRESSION,
            expressionZ: Type.EXPRESSION,
            inputs: [["Tw2CurveScalar", "Tw2CurveScalarExpression", "Tw2PerlinCurve"]]
        }
    };
});

