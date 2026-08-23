import { meta } from "utils";

@meta.define({
    wgl: "EveSOFDataHullExtensionPlacementDistributionParentMatch",
    ccp: true
})
export class EveSOFDataHullExtensionPlacementDistributionParentMatch extends meta.Model
{

    @meta.boolean
    matchHull = true;

    @meta.boolean
    matchFaction = true;

    @meta.struct()
    parentDescriptor = null;

}