import {Tw2BaseClass} from "../global";

/**
 * Tr2StateMachine
 * Todo: Implement
 *
 * @property {Number} startState                   -
 * @property {Array.<Tr2StateMachineState>} states -
 */
export class Tr2StateMachine extends Tw2BaseClass
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
        },
        notImplemented: ["*"]
    };
});

