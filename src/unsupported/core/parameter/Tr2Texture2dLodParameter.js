import { meta, Tw2BaseClass } from "global";

/**
 * Tr2Texture2dLodParameter
 * TODO: Implement
 *
 * @property {String} name                -
 * @property {Tw2LodResource} lodResource -
 */
@meta.data({
    ccp: "Tr2Texture2dLodParameter",
    notImplemented: true
})
export class Tr2Texture2dLodParameter extends Tw2BaseClass
{

    @meta.black.string
    name = "";

    @meta.black.object
    lodResource = null;

}
