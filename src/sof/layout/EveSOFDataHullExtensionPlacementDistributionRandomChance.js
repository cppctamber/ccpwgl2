import { meta } from "utils";

@meta.type("EveSOFDataHullExtensionPlacementDistributionRandomChance")
@meta.define({
    wgl: "EveSOFDataHullExtensionPlacementDistributionRandomChance",
    ccp: true
})
export class EveSOFDataHullExtensionPlacementDistributionRandomChance extends meta.Model
{

    @meta.string
    name = "";

    @meta.float
    chanceOfUsage = 1.0;

}