import { meta, Tw2BaseClass } from "global";


@meta.notImplemented
@meta.type("Tw2CurveSetRange", true)
export class Tw2CurveSetRange extends Tw2BaseClass
{

    @meta.black.string
    name = "";

    @meta.black.float
    endTime = 0;

    @meta.black.boolean
    looped = false;

    @meta.black.float
    startTime = 0;

}
