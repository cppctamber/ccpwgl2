import { meta } from "utils";


@meta.define({
    wgl: "EveSOFDataHullExtensionPlacementDistributionMapGraphicSettings",
    ccp: true
})
export class EveSOFDataHullExtensionPlacementDistributionMapGraphicSettings extends meta.Model
{

    @meta.string
    name = "";

    @meta.notImplemented
    @meta.int32
    displayFilter = -1;

}
