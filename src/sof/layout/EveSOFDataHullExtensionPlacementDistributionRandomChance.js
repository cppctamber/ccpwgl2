import { meta } from "utils";

@meta.type("EveSOFDataHullExtensionPlacementDistributionRandomChance")
export class EveSOFDataHullExtensionPlacementDistributionRandomChance extends meta.Model
{

    @meta.string
    name = "";

    @meta.float
    chanceOfUsage = 1.0;

}