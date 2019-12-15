import { meta, Tw2BaseClass } from "global";

/**
 * Tr2StateMachineState
 *
 * @property {String} name                                   -
 * @property {Array.<StateAction>} actions                   -
 * @property {Tr2SyncToAnimation} finalizer                  -
 * @property {Array.<Tr2StateMachineTransition>} transitions -
 */
@meta.notImplemented
@meta.type("Tr2StateMachineState", true)
export class Tr2StateMachineState extends Tw2BaseClass
{

    @meta.black.string
    name = "";

    @meta.black.list
    actions = [];

    @meta.black.object
    finalizer = null;

    @meta.black.list
    transitions = [];

}
