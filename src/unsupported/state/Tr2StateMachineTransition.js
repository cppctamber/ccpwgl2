import { meta, Tw2BaseClass } from "global";


@meta.notImplemented
@meta.type("Tr2StateMachineTransition", true)
export class Tr2StateMachineTransition extends Tw2BaseClass
{

    @meta.black.string
    name = "";

    @meta.black.string
    condition = "";

}
