import { meta } from "utils";


@meta.notImplemented
@meta.type("Tr2KelvinColor")
export class Tr2KelvinColor extends meta.Model
{

    @meta.float
    temperature = 0;

    @meta.float
    tint = 0;

}
