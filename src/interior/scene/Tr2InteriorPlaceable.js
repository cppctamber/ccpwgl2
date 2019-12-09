import { meta, Tw2BaseClass } from "global";


/**
 * Tr2InteriorPlaceable
 *
 * @property {String} placeableResPath -
 * @property {TriMatrix} transform     -
 */
@meta.ccp("Tr2InteriorPlaceable")
@meta.notImplemented
export class Tr2InteriorPlaceable extends Tw2BaseClass
{

    @meta.black.path
    placeableResPath = "";

    @meta.black.object
    transform = null;

}
