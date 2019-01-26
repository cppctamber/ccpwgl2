import {Tw2BaseClass} from "../../global";

/**
 * Tr2CurveEulerRotationExpression
 *
 * @property {String} expressionPitch               -
 * @property {String} expressionRoll                -
 * @property {String} expressionYaw                 -
 * @property {Array.<Curve|CurveExpression>} inputs -
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

