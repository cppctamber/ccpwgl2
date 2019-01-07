import {Tw2StagingClass} from "../../class";

/**
 * Tw2ActionSetValue
 * @ccp Tr2ActionSetValue
 * @implements StateAction
 *
 * @parameter {String} attribute -
 * @parameter {String} path      -
 * @parameter {String} value     -
 */
export default class Tw2ActionSetValue extends Tw2StagingClass
{

    attribute = "";
    path = "";
    value = "";

}

Tw2StagingClass.define(Tw2ActionSetValue, Type =>
{
    return {
        type: "Tw2ActionSetValue",
        category: "StateAction",
        props: {
            attribute: Type.STRING,
            path: Type.PATH,
            value: Type.STRING
        }
    };
});

