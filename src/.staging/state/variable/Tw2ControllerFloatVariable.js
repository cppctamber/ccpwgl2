import {Tw2StagingClass} from "../../class";

/**
 * Tw2ControllerFloatVariable
 * @ccp Tr2ControllerFloatVariable
 * @implements StateVariable
 *
 * @parameter {Number} defaultValue -
 * @parameter {Number} variableType -
 */
export default class Tw2ControllerFloatVariable extends Tw2StagingClass
{

    defaultValue = 0;
    variableType = 0;

}

Tw2StagingClass.define(Tw2ControllerFloatVariable, Type =>
{
    return {
        type: "Tw2ControllerFloatVariable",
        category: "StateVariable",
        props: {
            defaultValue: Type.NUMBER,
            variableType: Type.NUMBER
        }
    };
});

