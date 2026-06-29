import { meta } from "utils";


@meta.define({
    ccp: "Tr2CurveSetRange",
    wgl: "Tw2CurveSetRange"
})
export class Tr2CurveSetRange extends meta.Model
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

export { Tr2CurveSetRange as Tw2CurveSetRange };
