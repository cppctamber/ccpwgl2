import { meta } from "utils";


@meta.type("EveSOFDataHullExtensionPlacementDistributionDepletionCounter")
export class EveSOFDataHullExtensionPlacementDistributionDepletionCounter extends meta.Model
{

    @meta.string
    name = "";

    @meta.list("EveSOFDataDistributionDepletionCounter")
    depletionCounters = [];

}
