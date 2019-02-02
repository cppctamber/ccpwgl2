import {Tw2BaseClass} from "../../global";

/**
 * Tr2ControllerFloatVariable
 * Todo: Implement
 * Todo: Identify if "variableType" expects an Enum
 *
 * @property {Number} defaultValue -
 * @property {Number} variableType -
 */
export class Tr2ControllerFloatVariable extends Tw2BaseClass
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
        },
        notImplemented: [
            "defaultValue",
            "variableType"
        ]
    };
});

