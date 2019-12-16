import { meta } from "global";
import { Tw2Action } from "./Tw2Action";


@meta.notImplemented
@meta.type("Tr2ActionChildEffect", true)
export class Tr2ActionChildEffect extends Tw2Action
{

    @meta.black.string
    childName = "";

    @meta.black.path
    path = "";

    @meta.black.boolean
    removeOnStop = false;

}
