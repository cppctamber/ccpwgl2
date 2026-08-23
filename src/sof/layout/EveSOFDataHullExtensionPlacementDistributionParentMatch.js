import { meta } from "utils";

@meta.define("EveSOFDataHullExtensionPlacementDistributionParentMatch", true)
export class EveSOFDataHullExtensionPlacementDistributionParentMatch extends meta.Model
{

    @meta.boolean
    matchHull = true;

    @meta.boolean
    matchFaction = true;

    @meta.struct()
    parentDescriptor = null;

}