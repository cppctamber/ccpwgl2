import {Tw2StagingClass} from "../class";

/**
 * Tw2StateMachineState
 * @ccp Tr2StateMachineState
 *
 * @parameter {Array.<StateAction>} actions                   -
 * @parameter {Tw2SyncToAnimation} finalizer                  -
 * @parameter {Array.<Tw2StateMachineTransition>} transitions -
 */
export default class Tw2StateMachineState extends Tw2StagingClass
{

    actions = [];
    finalizer = null;
    transitions = [];

}

Tw2StagingClass.define(Tw2StateMachineState, Type =>
{
    return {
        type: "Tw2StateMachineState",
        props: {
            actions: Type.ARRAY,
            finalizer: ["Tw2SyncToAnimation"],
            transitions: [["Tw2StateMachineTransition"]]
        }
    };
});

