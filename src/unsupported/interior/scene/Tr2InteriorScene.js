import { meta, Tw2BaseClass } from "global";


@meta.notImplemented
@meta.type("Tr2InteriorScene", true)
export class Tr2InteriorScene extends Tw2BaseClass
{

    @meta.black.listOf("Tr2IntSkinnedObject")
    dynamics = [];

    @meta.black.listOf("Tr2InteriorLightSource")
    lights = [];

}
