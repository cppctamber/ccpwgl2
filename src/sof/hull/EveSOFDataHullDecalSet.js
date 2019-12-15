import { meta } from "global/index";


@meta.type("EveSOFDataHullDecalSet", true)
export class EveSOFDataHullDecalSet
{

    @meta.black.string
    name = "";

    @meta.black.listOf("EveSOFDataHullDecalSetItem")
    items = [];

    @meta.black.string
    visibilityGroup = "";

}
