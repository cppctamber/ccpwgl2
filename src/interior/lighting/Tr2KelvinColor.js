import { meta, Tw2BaseClass } from "global";


@meta.notImplemented
@meta.type("Tr2KelvinColor", true)
export class Tr2KelvinColor extends Tw2BaseClass
{

    @meta.black.float
    temperature = 0;

    @meta.black.float
    tint = 0;

}
