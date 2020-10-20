import { meta } from "utils";


@meta.notImplemented
@meta.type("Tr2StateMachineTransition")
export class Tr2StateMachineTransition extends meta.Model
{

    @meta.string
    name = "";

    @meta.string
    condition = "";

}
