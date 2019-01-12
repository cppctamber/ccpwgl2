import {Tw2BaseClass} from "../../global";

/**
 * Tr2ActionSetValue
 * @implements StateAction
 * Todo: Implement
 *
 * @property {String} attribute -
 * @property {String} path      -
 * @property {String} value     -
 */
export default class Tr2ActionSetValue extends Tw2BaseClass
{

    attribute = "";
    path = "";
    value = "";

}

Tw2BaseClass.define(Tr2ActionSetValue, Type =>
{
    return {
        isStaging: true,
        type: "Tr2ActionSetValue",
        category: "StateAction",
        props: {
            attribute: Type.STRING,
            path: Type.PATH,
            value: Type.STRING
        },
        notImplemented: [
            "attribute",
            "path",
            "value"
        ]
    };
});

