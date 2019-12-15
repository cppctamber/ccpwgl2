import { meta, Tw2BaseClass } from "global";


@meta.notImplemented
@meta.type("Tr2SkinnedModel", true)
export class Tr2SkinnedModel extends Tw2BaseClass
{

    @meta.black.string
    name = "";

    @meta.black.path
    geometryResPath = "";

    @meta.black.list
    meshes = [];

    @meta.black.string
    skeletonName = "";

}
