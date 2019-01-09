import {Tw2BaseClass} from "../class";

/**
 * Tr2StateMachine
 *
 * @parameter {Number} startState                   -
 * @parameter {Array.<Tr2StateMachineState>} states -
 */
export default class Tr2StateMachine extends Tw2BaseClass
{

    startState = 0;
    states = [];

}

Tw2BaseClass.define(Tr2StateMachine, Type =>
{
    return {
        isStaging: true,
        type: "Tr2StateMachine",
        props: {
            startState: Type.NUMBER,
            states: [["Tr2StateMachineState"]]
        }
    };
});

