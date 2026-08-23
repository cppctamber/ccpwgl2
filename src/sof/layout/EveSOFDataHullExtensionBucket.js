import { meta } from "utils";
import { EveSOFDataHullExtensionPlacement } from "./EveSOFDataHullExtensionPlacement";


@meta.define("EveSOFDataHullExtensionBucket", true)
export class EveSOFDataHullExtensionBucket extends EveSOFDataHullExtensionPlacement
{

    @meta.string
    name = "";

    @meta.list("EveSOFDataDistributionDepletionCounter")
    depletionCounters = [];

    @meta.list("EveSOFDataHullExtensionPlacement")
    placements = [];

    /**
     * Carbon bucket/group-like helper.
     * @returns {boolean}
     */
    IsBucket()
    {
        return true;
    }

}
