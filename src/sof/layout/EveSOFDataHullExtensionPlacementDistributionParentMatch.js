import { meta } from "utils";

@meta.type("EveSOFDataHullExtensionPlacementDistributionParentMatch")
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