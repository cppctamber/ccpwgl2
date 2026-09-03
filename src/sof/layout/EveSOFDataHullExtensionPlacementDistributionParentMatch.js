import { meta } from "utils";
import { EveSOFDNADescriptor } from "../shared/EveSOFDNADescriptor";

@meta.define("EveSOFDataHullExtensionPlacementDistributionParentMatch", true)
export class EveSOFDataHullExtensionPlacementDistributionParentMatch extends meta.Model
{

    @meta.string
    name = "";

    @meta.boolean
    matchHull = true;

    @meta.boolean
    matchFaction = true;

    @meta.struct("EveSOFDNADescriptor")
    parentDescriptor = new EveSOFDNADescriptor();

}
