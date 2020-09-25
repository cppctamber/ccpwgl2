import { meta, Tw2BaseClass } from "global";


@meta.notImplemented
@meta.ctor("Tr2StateMachineState")
export class Tr2StateMachineState extends Tw2BaseClass
{

    @meta.string
    name = "";

    @meta.list("Tw2Action")
    actions = [];

    @meta.struct()
    finalizer = null;

    @meta.list("Tr2StateMachineTransition")
    transitions = [];

}
