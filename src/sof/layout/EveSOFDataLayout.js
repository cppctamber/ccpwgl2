import { meta } from "utils";


@meta.type("EveSOFDataLayout")
@meta.define({
    wgl: "EveSOFDataLayout",
    ccp: true
})
export class EveSOFDataLayout extends meta.Model
{
    @meta.string
    name = "";

    @meta.int32
    seed = 1337;

    @meta.list("EveSOFDataDistributionDepletionCounter")
    depletionCounters = [];

    @meta.list()
    placements = [];

    @meta.boolean
    randomizeSeedOnLoad = false;

}
