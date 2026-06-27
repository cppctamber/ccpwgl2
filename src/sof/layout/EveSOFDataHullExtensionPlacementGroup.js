import { meta } from "utils";


@meta.type("EveSOFDataHullExtensionPlacementGroup")
@meta.define({
    wgl: "EveSOFDataHullExtensionPlacementGroup",
    ccp: true
})
export class EveSOFDataHullExtensionPlacementGroup extends meta.Model
{

    @meta.string
    name = "";

    @meta.boolean
    enabled = true;

    @meta.list("EveSOFDataDistributionDepletionCount")
    depletionCounters = [];

    @meta.list()
    distributionConditions = [];

    @meta.list("EveSOFDataHullExtensionPlacement")
    placements = [];

}
