import { meta } from "utils";
import { Tw2Action } from "./Tw2Action";


@meta.notImplemented
@meta.ctor("Tr2ActionSetValue")
export class Tr2ActionSetValue extends Tw2Action
{

    @meta.string
    attribute = "";

    @meta.path
    path = "";

    @meta.string
    value = "";

}
