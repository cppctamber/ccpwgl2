import { meta } from "utils";


@meta.notImplemented
@meta.type("Tr2StateMachineState")
export class Tr2StateMachineState extends meta.Model
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
