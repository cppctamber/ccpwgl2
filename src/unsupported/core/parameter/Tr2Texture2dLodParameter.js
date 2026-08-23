import { meta } from "utils";
import { Tw2Parameter } from "core";

@meta.notImplemented
@meta.define("Tr2Texture2dLodParameter", true)
export class Tr2Texture2dLodParameter extends Tw2Parameter
{

    @meta.string
    name = "";

    @meta.struct("Tr2LodResource")
    lodResource = null;

}
