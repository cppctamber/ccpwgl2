import { meta } from "utils";


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

    @meta.list("EveSOFDataDistributionDepletionCounter")
    depletionCounters = [];

    @meta.list()
    distributionConditions = [];

    @meta.list("EveSOFDataHullExtensionPlacement")
    placements = [];

}
