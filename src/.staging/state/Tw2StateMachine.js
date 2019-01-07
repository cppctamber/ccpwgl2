import {Tw2StagingClass} from "../class";

/**
 * Tw2StateMachine
 * @ccp Tr2StateMachine
 *
 * @parameter {Number} startState                   -
 * @parameter {Array.<Tw2StateMachineState>} states -
 */
export default class Tw2StateMachine extends Tw2StagingClass
{

    startState = 0;
    states = [];

}

Tw2StagingClass.define(Tw2StateMachine, Type =>
{
    return {
        type: "Tw2StateMachine",
        props: {
            startState: Type.NUMBER,
            states: [["Tw2StateMachineState"]]
        }
    };
});

