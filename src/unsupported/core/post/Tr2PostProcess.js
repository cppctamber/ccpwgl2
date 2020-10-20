import { meta } from "utils";


@meta.notImplemented
@meta.type("Tr2PostProcess")
export class Tr2PostProcess extends meta.Model
{

    @meta.list("Tw2Effect")
    stages = [];

}
