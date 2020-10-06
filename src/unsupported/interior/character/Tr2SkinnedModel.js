import { meta } from "global";


@meta.notImplemented
@meta.ctor("Tr2SkinnedModel")
export class Tr2SkinnedModel extends meta.Model
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
