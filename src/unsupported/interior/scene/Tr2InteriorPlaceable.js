import { meta } from "utils";


@meta.notImplemented
@meta.type("Tr2InteriorPlaceable")
export class Tr2InteriorPlaceable extends meta.Model
{

    @meta.path
    placeableResPath = "";

    @meta.struct("TriMatrix")
    transform = null;

}
