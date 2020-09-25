import { meta, Tw2BaseClass } from "global";


@meta.notImplemented
@meta.ctor("Tw2CurveSetRange")
export class Tw2CurveSetRange extends Tw2BaseClass
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
