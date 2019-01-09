import {Tw2BaseClass} from "../../class";

/**
 * Tr2ActionAnimateValue
 * @implements StateAction
 *
 * @parameter {String} attribute               -
 * @parameter {Tr2CurveScalarExpression} curve -
 * @parameter {String} path                    -
 * @parameter {String} value                   -
 */
export default class Tr2ActionAnimateValue extends Tw2BaseClass
{

    attribute = "";
    curve = null;
    path = "";
    value = "";

}

Tw2BaseClass.define(Tr2ActionAnimateValue, Type =>
{
    return {
        isStaging: true,
        type: "Tr2ActionAnimateValue",
        category: "StateAction",
        props: {
            attribute: Type.STRING,
            curve: ["Tr2CurveScalarExpression"],
            path: Type.PATH,
            value: Type.STRING
        }
    };
});

