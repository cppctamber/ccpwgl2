import { meta } from "utils";


@meta.type("EveSOFDataHullExtensionPlacementDistributionMapGraphicSettings")
@meta.define({
    wgl: "EveSOFDataHullExtensionPlacementDistributionMapGraphicSettings",
    ccp: true
})
export class EveSOFDataHullExtensionPlacementDistributionMapGraphicSettings extends meta.Model
{

    @meta.string
    name = "";

    @meta.notImplemented
    @meta.uint
    displayFilter = -1;

}
