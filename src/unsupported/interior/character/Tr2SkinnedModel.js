import { meta } from "utils";


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
