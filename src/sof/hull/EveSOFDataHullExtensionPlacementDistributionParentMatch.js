import { meta } from "utils";

@meta.type("EveSOFDataHullExtensionPlacementDistributionParentMatch")
export class EveSOFDataHullExtensionPlacementDistributionParentMatch extends meta.Model
{

    @meta.boolean
    matchHull = true;

    @meta.boolean
    matchFaction = true;

    @meta.struct()
    parentDescriptor = null;

}