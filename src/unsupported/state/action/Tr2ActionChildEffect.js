import { meta } from "utils";
import { Tw2Action } from "./Tw2Action";


@meta.notImplemented
@meta.type("Tr2ActionChildEffect")
export class Tr2ActionChildEffect extends Tw2Action
{

    @meta.string
    childName = "";

    @meta.path
    path = "";

    @meta.boolean
    removeOnStop = false;

}
