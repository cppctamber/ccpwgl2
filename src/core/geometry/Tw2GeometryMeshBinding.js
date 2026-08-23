import { meta } from "utils";


@meta.define("Tw2GeometryMeshBinding")
export class Tw2GeometryMeshBinding
{

    @meta.struct("Tw2GeometryMesh")
    mesh = null;

    @meta.list("Tw2GeometryBone")
    bones = [];

}
