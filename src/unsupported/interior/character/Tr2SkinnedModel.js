import { meta, Tw2BaseClass } from "global";


@meta.notImplemented
@meta.ctor("Tr2SkinnedModel")
export class Tr2SkinnedModel extends Tw2BaseClass
{

    @meta.string
    name = "";

    @meta.path
    geometryResPath = "";

    @meta.list()
    meshes = [];

    @meta.string
    skeletonName = "";

}
