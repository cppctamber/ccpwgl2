import {Tw2StagingClass} from "../../class";

/**
 * Tw2ActionAnimateValue
 * @ccp Tr2ActionAnimateValue
 * @implements StateAction
 *
 * @parameter {String} attribute               -
 * @parameter {Tw2CurveScalarExpression} curve -
 * @parameter {String} path                    -
 * @parameter {String} value                   -
 */
export default class Tw2ActionAnimateValue extends Tw2StagingClass
{

    attribute = "";
    curve = null;
    path = "";
    value = "";

}

Tw2StagingClass.define(Tw2ActionAnimateValue, Type =>
{
    return {
        type: "Tw2ActionAnimateValue",
        category: "StateAction",
        props: {
            attribute: Type.STRING,
            curve: ["Tw2CurveScalarExpression"],
            path: Type.PATH,
            value: Type.STRING
        }
    };
});

