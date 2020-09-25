import { meta } from "global";
import { Tw2Action } from "./Tw2Action";


@meta.notImplemented
@meta.ctor("Tr2ActionPlaySound")
export class Tr2ActionPlaySound extends Tw2Action
{

    @meta.string
    emitter = "";

    @meta.string
    event = "";

}
