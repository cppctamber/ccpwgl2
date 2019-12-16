import { meta } from "global";
import { Tw2Action } from "./Tw2Action";


@meta.notImplemented
@meta.type("Tr2ActionSetValue", true)
export class Tr2ActionSetValue extends Tw2Action
{

    @meta.black.string
    attribute = "";

    @meta.black.path
    path = "";

    @meta.black.string
    value = "";

}
