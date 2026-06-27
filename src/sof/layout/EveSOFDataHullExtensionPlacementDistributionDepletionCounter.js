import { meta } from "utils";


@meta.type("EveSOFDataHullExtensionPlacementDistributionDepletionCounter")
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
