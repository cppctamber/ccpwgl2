import { meta, Tw2BaseClass } from "global";


@meta.notImplemented
@meta.type("Tr2StateMachineState", true)
export class Tr2StateMachineState extends Tw2BaseClass
{

    @meta.black.string
    name = "";

    @meta.black.listOf("Tw2Action")
    actions = [];

    @meta.black.object
    finalizer = null;

    @meta.black.listOf("Tr2StateMachineTransition")
    transitions = [];

}
