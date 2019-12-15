import { meta, Tw2BaseClass } from "global";

/**
 * Tr2StateMachine
 *
 * @property {String} name                         -
 * @property {Number} startState                   -
 * @property {Array.<Tr2StateMachineState>} states -
 */
@meta.notImplemented
@meta.type("Tr2StateMachine", true)
export class Tr2StateMachine extends Tw2BaseClass
{

    @meta.black.string
    name = "";

    @meta.black.uint
    startState = 0;

    @meta.black.list
    states = [];

}
