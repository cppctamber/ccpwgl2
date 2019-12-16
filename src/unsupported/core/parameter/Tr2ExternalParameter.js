import { meta } from "global";
import { Tw2Parameter } from "core/parameter/Tw2Parameter";


@meta.notImplemented
@meta.type("Tr2ExternalParameter", true)
export class Tr2ExternalParameter extends Tw2Parameter
{

    @meta.black.string
    name = "";

    @meta.black.string
    destinationAttribute = "";

    @meta.black.object
    destinationObject = null;

}
