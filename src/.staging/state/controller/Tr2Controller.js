import {Tw2BaseClass} from "../../../global";

/**
 * Tr2Controller
 * @implements StateController
 *
 * @property {Boolean} isShared                      -
 * @property {Array.<Tr2StateMachine>} stateMachines -
 * @property {Array.<StateVariable>} variables       -
 */
export default class Tr2Controller extends Tw2BaseClass
{

    isShared = false;
    stateMachines = [];
    variables = [];

}

Tw2BaseClass.define(Tr2Controller, Type =>
{
    return {
        isStaging: true,
        type: "Tr2Controller",
        category: "StateController",
        props: {
            isShared: Type.BOOLEAN,
            stateMachines: [["Tr2StateMachine"]],
            variables: [["Tr2ControllerFloatVariable"]]
        }
    };
});

