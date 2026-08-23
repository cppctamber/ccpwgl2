import { meta } from "utils";


@meta.wgl.define("Tw2MeshBinding")
export class Tw2MeshBinding
{

    @meta.list("Float32Array")
    meshIndex = [];

    @meta.struct("Tw2GeometryRes")
    resource = null;

}
