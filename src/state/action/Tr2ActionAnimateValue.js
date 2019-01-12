import {Tw2BaseClass} from "../../global";

/**
 * Tr2ActionAnimateValue
 * @implements StateAction
 * Todo: Implement
 *
 * @property {String} attribute               -
 * @property {Tr2CurveScalarExpression} curve -
 * @property {String} path                    -
 * @property {String} value                   -
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
        },
        notImplemented: [
            "attribute",
            "curve",
            "path",
            "value"
        ]
    };
});

