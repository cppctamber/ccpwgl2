import { meta } from "utils";
import { Tw2Parameter } from "core/parameter/Tw2Parameter";


@meta.notImplemented
@meta.ctor("Tr2ExternalParameter")
export class Tr2ExternalParameter extends Tw2Parameter
{

    @meta.string
    name = "";

    @meta.string
    destinationAttribute = "";

    @meta.struct()
    destinationObject = null;

}
