import {Tw2BaseClass} from "../../global/index";

/**
 * Tr2CurveVector3Expression
 *
 * @property {String} expressionX                   -
 * @property {String} expressionY                   -
 * @property {String} expressionZ                   -
 * @property {Array.<Curve|CurveExpression>} inputs -
 */
export default class Tr2CurveVector3Expression extends Tw2BaseClass
{

    expressionX = "";
    expressionY = "";
    expressionZ = "";
    inputs = [];

}

Tw2BaseClass.define(Tr2CurveVector3Expression, Type =>
{
    return {
        isStaging: true,
        type: "Tr2CurveVector3Expression",
        category: "CurveExpression",
        props: {
            expressionX: Type.EXPRESSION,
            expressionY: Type.EXPRESSION,
            expressionZ: Type.EXPRESSION,
            inputs: [["Tr2CurveScalar", "Tr2CurveScalarExpression", "TriPerlinCurve"]]
        }
    };
});

