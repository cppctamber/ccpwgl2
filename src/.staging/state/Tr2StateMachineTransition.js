import {Tw2BaseClass} from "../class";

/**
 * Tr2StateMachineTransition
 *
 * @parameter {String} condition -
 */
export default class Tr2StateMachineTransition extends Tw2BaseClass
{

    condition = "";

}

Tw2BaseClass.define(Tr2StateMachineTransition, Type =>
{
    return {
        isStaging: true,
        type: "Tr2StateMachineTransition",
        props: {
            condition: Type.STRING
        }
    };
});

