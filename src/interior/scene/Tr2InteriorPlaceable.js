import { meta, Tw2BaseClass } from "global";


@meta.notImplemented
@meta.type("Tr2InteriorPlaceable", true)
export class Tr2InteriorPlaceable extends Tw2BaseClass
{

    @meta.black.path
    placeableResPath = "";

    @meta.black.objectOf("TriMatrix")
    transform = null;

}
