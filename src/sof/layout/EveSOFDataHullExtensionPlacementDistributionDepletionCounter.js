import { meta } from "utils";


@meta.define({
    wgl: "EveSOFDataHullExtensionPlacementDistributionDepletionCounter",
    ccp: true
})
export class EveSOFDataHullExtensionPlacementDistributionDepletionCounter extends meta.Model
{

    @meta.string
    name = "";

    @meta.list("EveSOFDataDistributionDepletionCounter")
    depletionCounters = [];

}
