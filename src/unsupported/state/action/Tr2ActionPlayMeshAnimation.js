import { meta } from "global";
import { Tw2Action } from "./Tw2Action";


@meta.notImplemented
@meta.type("Tr2ActionPlayMeshAnimation", true)
export class Tr2ActionPlayMeshAnimation extends Tw2Action
{

    @meta.black.string
    animation = "";

    @meta.black.uint
    loops = 0;

    @meta.black.string
    mask = "";

}
