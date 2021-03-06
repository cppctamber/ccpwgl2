import { meta } from "utils";


@meta.notImplemented
@meta.type("Tr2InteriorScene")
export class Tr2InteriorScene extends meta.Model
{

    @meta.list("Tr2IntSkinnedObject")
    dynamics = [];

    @meta.list("Tr2InteriorLightSource")
    lights = [];

}
