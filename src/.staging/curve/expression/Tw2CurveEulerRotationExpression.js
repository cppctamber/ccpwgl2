import {Tw2StagingClass} from "../../class";

/**
 * Tw2CurveEulerRotationExpression
 * @ccp Tr2CurveEulerRotationExpression
 * @implements CurveExpression
 *
 * @parameter {String} expressionPitch               -
 * @parameter {String} expressionRoll                -
 * @parameter {String} expressionYaw                 -
 * @parameter {Array.<Curve|CurveExpression>} inputs -
 */
export default class Tw2CurveEulerRotationExpression extends Tw2StagingClass
{

    expressionPitch = "";
    expressionRoll = "";
    expressionYaw = "";
    inputs = [];

}

Tw2StagingClass.define(Tw2CurveEulerRotationExpression, Type =>
{
    return {
        type: "Tw2CurveEulerRotationExpression",
        category: "CurveExpression",
        props: {
            expressionPitch: Type.EXPRESSION,
            expressionRoll: Type.EXPRESSION,
            expressionYaw: Type.EXPRESSION,
            inputs: [["Tw2CurveScalar", "Tw2CurveScalarExpression", "Tw2PerlinCurve"]]
        }
    };
});

