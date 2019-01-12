import {Tw2BaseClass} from "../global";

/**
 * Tr2StateMachineTransition
 * Todo: Implement
 *
 * @property {String} condition -
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
        },
        notImplemented: [
            "condition"
        ]
    };
});

