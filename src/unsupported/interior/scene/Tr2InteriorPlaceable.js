import { meta, Tw2BaseClass } from "global";


@meta.notImplemented
@meta.ctor("Tr2InteriorPlaceable")
export class Tr2InteriorPlaceable extends Tw2BaseClass
{

    @meta.path
    placeableResPath = "";

    @meta.struct("TriMatrix")
    transform = null;

}
