import { meta, Tw2BaseClass } from "global";


@meta.notImplemented
@meta.type("Tr2Model", true)
export class Tr2Model extends Tw2BaseClass
{

    @meta.black.listOf("Tw2Mesh")
    meshes = [];

}
