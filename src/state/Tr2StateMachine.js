import { meta, Tw2BaseClass } from "global";


@meta.notImplemented
@meta.type("Tr2StateMachine", true)
export class Tr2StateMachine extends Tw2BaseClass
{

    @meta.black.string
    name = "";

    @meta.black.uint
    startState = 0;

    @meta.black.listOf("Tr2StateMachineState")
    states = [];

}
