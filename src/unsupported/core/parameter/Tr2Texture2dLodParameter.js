import { meta } from "global";
import { Tw2Parameter } from "core";

@meta.notImplemented
@meta.type("Tr2Texture2dLodParameter", true)
export class Tr2Texture2dLodParameter extends Tw2Parameter
{

    @meta.black.string
    name = "";

    @meta.black.objectOf("Tr2LodResource")
    lodResource = null;

}
