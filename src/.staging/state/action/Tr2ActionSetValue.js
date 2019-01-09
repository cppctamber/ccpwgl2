import {Tw2BaseClass} from "../../class";

/**
 * Tr2ActionSetValue
 * @implements StateAction
 *
 * @parameter {String} attribute -
 * @parameter {String} path      -
 * @parameter {String} value     -
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
        }
    };
});

