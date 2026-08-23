import { meta } from "utils";


@meta.define("EveSOFDataHullExtensionPlacementDistributionDepletionCounter", true)
export class EveSOFDataHullExtensionPlacementDistributionDepletionCounter extends meta.Model
{

    @meta.string
    name = "";

    @meta.list("EveSOFDataDistributionDepletionCounter")
    depletionCounters = [];

}
