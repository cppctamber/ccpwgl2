import { meta } from "utils";


@meta.notImplemented
@meta.ctor("Tw2CurveSetRange")
export class Tw2CurveSetRange extends meta.Model
{

    @meta.string
    name = "";

    @meta.float
    endTime = 0;

    @meta.boolean
    looped = false;

    @meta.float
    startTime = 0;

}
