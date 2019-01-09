import {Tw2BaseClass} from "../../class";

/**
 * Tr2Controller
 * @implements StateController
 *
 * @parameter {Boolean} isShared                      -
 * @parameter {Array.<Tr2StateMachine>} stateMachines -
 * @parameter {Array.<StateVariable>} variables       -
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

