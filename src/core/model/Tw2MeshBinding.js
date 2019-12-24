import { meta } from "global";


@meta.type("Tw2MeshBinding")
export class Tw2MeshBinding
{

    @meta.listOf("Float32Array")
    meshIndex = [];

    @meta.objectOf("Tw2GeometryRes")
    resource = null;

}
