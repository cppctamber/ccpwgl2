import { meta  } from "global";


@meta.type("Tw2GeometryMeshBinding")
export class Tw2GeometryMeshBinding
{

    @meta.objectOf("Tw2GeometryMesh")
    mesh = null;

    @meta.listOf("Tw2GeometryBone")
    bones = [];

}
