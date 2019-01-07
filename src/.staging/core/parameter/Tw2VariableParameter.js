import {Tw2StagingClass} from "../../class";

/**
 * Tw2VariableParameter
 * @ccp TriVariableParameter
 * @implements Parameter
 *
 * @parameter {String} variableName -
 */
export default class Tw2VariableParameter extends Tw2StagingClass
{

    variableName = "";

}

Tw2StagingClass.define(Tw2VariableParameter, Type =>
{
    return {
        type: "Tw2VariableParameter",
        category: "Parameter",
        props: {
            variableName: Type.STRING
        }
    };
});

