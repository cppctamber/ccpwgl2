import {Tw2StagingClass} from "../../class";

/**
 * Tw2Controller
 * @ccp Tr2Controller
 * @implements StateController
 *
 * @parameter {Boolean} isShared                      -
 * @parameter {Array.<Tw2StateMachine>} stateMachines -
 * @parameter {Array.<StateVariable>} variables       -
 */
export default class Tw2Controller extends Tw2StagingClass
{

    isShared = false;
    stateMachines = [];
    variables = [];

}

Tw2StagingClass.define(Tw2Controller, Type =>
{
    return {
        type: "Tw2Controller",
        category: "StateController",
        props: {
            isShared: Type.BOOLEAN,
            stateMachines: [["Tw2StateMachine"]],
            variables: [["Tw2ControllerFloatVariable"]]
        }
    };
});

