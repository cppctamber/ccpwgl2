import {Tw2BaseClass} from "../../class";

/**
 * Tr2CurveEulerRotationExpression
 * @implements CurveExpression
 *
 * @parameter {String} expressionPitch               -
 * @parameter {String} expressionRoll                -
 * @parameter {String} expressionYaw                 -
 * @parameter {Array.<Curve|CurveExpression>} inputs -
 */
export default class Tr2CurveEulerRotationExpression extends Tw2BaseClass
{

    expressionPitch = "";
    expressionRoll = "";
    expressionYaw = "";
    inputs = [];

}

Tw2BaseClass.define(Tr2CurveEulerRotationExpression, Type =>
{
    return {
        isStaging: true,
        type: "Tr2CurveEulerRotationExpression",
        category: "CurveExpression",
        props: {
            expressionPitch: Type.EXPRESSION,
            expressionRoll: Type.EXPRESSION,
            expressionYaw: Type.EXPRESSION,
            inputs: [["Tr2CurveScalar", "Tr2CurveScalarExpression", "TriPerlinCurve"]]
        }
    };
});

