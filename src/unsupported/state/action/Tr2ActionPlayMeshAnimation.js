import { meta } from "utils";
import { Tw2Action } from "./Tw2Action";


@meta.notImplemented
@meta.type("Tr2ActionPlayMeshAnimation")
export class Tr2ActionPlayMeshAnimation extends Tw2Action
{

    @meta.string
    animation = "";

    @meta.uint
    loops = 0;

    @meta.string
    mask = "";

}
