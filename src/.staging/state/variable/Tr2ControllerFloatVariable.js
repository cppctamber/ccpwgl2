import {Tw2BaseClass} from "../../class";

/**
 * Tr2ControllerFloatVariable
 * @implements StateVariable
 *
 * @parameter {Number} defaultValue -
 * @parameter {Number} variableType -
 */
export default class Tr2ControllerFloatVariable extends Tw2BaseClass
{

    defaultValue = 0;
    variableType = 0;

}

Tw2BaseClass.define(Tr2ControllerFloatVariable, Type =>
{
    return {
        isStaging: true,
        type: "Tr2ControllerFloatVariable",
        category: "StateVariable",
        props: {
            defaultValue: Type.NUMBER,
            variableType: Type.NUMBER
        }
    };
});

