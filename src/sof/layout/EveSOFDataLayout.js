import { meta } from "utils";


@meta.define("EveSOFDataLayout", true)
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
