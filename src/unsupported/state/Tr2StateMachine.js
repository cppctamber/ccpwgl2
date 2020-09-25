import { meta, Tw2BaseClass } from "global";


@meta.notImplemented
@meta.ctor("Tr2StateMachine")
export class Tr2StateMachine extends Tw2BaseClass
{

    @meta.string
    name = "";

    @meta.uint
    startState = 0;

    @meta.list("Tr2StateMachineState")
    states = [];

}
