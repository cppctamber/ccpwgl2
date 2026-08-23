import { meta } from "utils";
import { Tw2Parameter } from "core/parameter/Tw2Parameter";


@meta.notImplemented
@meta.define("Tr2ExternalParameter", true)
export class Tr2ExternalParameter extends Tw2Parameter
{

    @meta.string
    name = "";

    @meta.string
    destinationAttribute = "";

    @meta.notOwned
    @meta.struct()
    destinationObject = null;

}
