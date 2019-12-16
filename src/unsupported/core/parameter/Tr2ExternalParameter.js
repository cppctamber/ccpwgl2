import { meta } from "global";
import { Tw2Parameter } from "./Tw2Parameter";

/**
 * Tr2ExternalParameter
 * TODO: Implement
 *
 * @property {String} name                 -
 * @property {String} destinationAttribute -
 * @property {*} destinationObject         -
 */
@meta.data({
    ccp: "Tr2ExternalParameter",
    notImplemented: true
})
export class Tr2ExternalParameter extends Tw2Parameter
{

    @meta.black.string
    name = "";

    @meta.black.string
    destinationAttribute = "";

    @meta.black.object
    destinationObject = null;

}
