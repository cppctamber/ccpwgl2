import { meta, Tw2BaseClass } from "global";


@meta.notImplemented
@meta.type("Tr2Controller", true)
export class Tr2Controller extends Tw2BaseClass
{

    @meta.black.string
    name = "";

    @meta.black.boolean
    isShared = false;

    @meta.black.listOf("Tr2StateMachine")
    stateMachines = [];

    @meta.black.listOf("Tr2ControllerFloatVariable")
    variables = [];

}
