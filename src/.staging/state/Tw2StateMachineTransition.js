import {Tw2StagingClass} from "../class";

/**
 * Tw2StateMachineTransition
 * @ccp Tr2StateMachineTransition
 *
 * @parameter {String} condition -
 */
export default class Tw2StateMachineTransition extends Tw2StagingClass
{

    condition = "";

}

Tw2StagingClass.define(Tw2StateMachineTransition, Type =>
{
    return {
        type: "Tw2StateMachineTransition",
        props: {
            condition: Type.STRING
        }
    };
});

