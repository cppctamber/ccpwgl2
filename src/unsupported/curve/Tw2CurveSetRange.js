import { meta } from "utils";


@meta.define({
    wgl: "Tw2CurveSetRange",
    ccp: "TriCurveSetRange"
})
export class Tw2CurveSetRange extends meta.Model
{
    @meta.string
    name = "";

    @meta.float
    startTime = 0;

    @meta.float
    endTime = 1;

    @meta.boolean
    looped = false;

    GetDuration()
    {
        return this.endTime - this.startTime;
    }
}

export { Tw2CurveSetRange as TriCurveSetRange };
