import {Tw2BaseClass} from "../../global/index";

/**
 * Tr2CurveScalarExpression
 *
 * @property {String} expression    -
 * @property {Number} input1        -
 * @property {Array.<Curve>} inputs -
 */
export default class Tr2CurveScalarExpression extends Tw2BaseClass
{

    expression = "";
    input1 = 0;
    inputs = [];

}

Tw2BaseClass.define(Tr2CurveScalarExpression, Type =>
{
    return {
        isStaging: true,
        type: "Tr2CurveScalarExpression",
        category: "CurveExpression",
        props: {
            expression: Type.EXPRESSION,
            input1: Type.NUMBER,
            inputs: [["Tr2CurveScalar", "TriPerlinCurve"]]
        }
    };
});

