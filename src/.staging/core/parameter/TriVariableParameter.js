import {Tw2BaseClass} from "../../../global";

/**
 * TriVariableParameter
 * @implements Parameter
 *
 * @property {String} variableName -
 */
export default class TriVariableParameter extends Tw2BaseClass
{

    variableName = "";

}

Tw2BaseClass.define(TriVariableParameter, Type =>
{
    return {
        isStaging: true,
        type: "TriVariableParameter",
        category: "Parameter",
        props: {
            variableName: Type.STRING
        }
    };
});

