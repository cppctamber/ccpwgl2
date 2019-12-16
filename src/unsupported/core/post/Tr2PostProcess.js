import { meta, Tw2BaseClass } from "global";


@meta.notImplemented
@meta.data("Tr2PostProcess", true)
export class Tr2PostProcess extends Tw2BaseClass
{

    @meta.black.listOf("Tw2Effect")
    stages = [];

}
