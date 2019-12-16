import { meta } from "global";
import { Tw2Action } from "./Tw2Action";


@meta.notImplemented
@meta.type("Tr2ActionPlaySound", true)
export class Tr2ActionPlaySound extends Tw2Action
{

    @meta.black.string
    emitter = "";

    @meta.black.string
    event = "";

}
