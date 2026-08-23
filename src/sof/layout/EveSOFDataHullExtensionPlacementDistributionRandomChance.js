import { meta } from "utils";

@meta.define("EveSOFDataHullExtensionPlacementDistributionRandomChance", true)
export class EveSOFDataHullExtensionPlacementDistributionRandomChance extends meta.Model
{

    @meta.string
    name = "";

    @meta.float
    chanceOfUsage = 1.0;

}