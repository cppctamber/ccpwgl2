import { meta } from "global";


@meta.type("EveSOFDataHullLightSet", true)
export class EveSOFDataHullLightSet
{

    @meta.black.string
    name = "";

    @meta.black.listOf("EveSOFDataHullLightSetItem")
    items = [];

    @meta.black.string
    visibilityGroup = "";

}
