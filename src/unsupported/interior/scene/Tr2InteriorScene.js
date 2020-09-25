import { meta, Tw2BaseClass } from "global";


@meta.notImplemented
@meta.ctor("Tr2InteriorScene")
export class Tr2InteriorScene extends Tw2BaseClass
{

    @meta.list("Tr2IntSkinnedObject")
    dynamics = [];

    @meta.list("Tr2InteriorLightSource")
    lights = [];

}
