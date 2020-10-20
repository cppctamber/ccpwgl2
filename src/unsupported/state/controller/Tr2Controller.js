import { meta } from "utils";


@meta.notImplemented
@meta.type("Tr2Controller")
export class Tr2Controller extends meta.Model
{

    @meta.string
    name = "";

    @meta.boolean
    isShared = false;

    @meta.list("Tr2StateMachine")
    stateMachines = [];

    @meta.list("Tr2ControllerFloatVariable")
    variables = [];

}
