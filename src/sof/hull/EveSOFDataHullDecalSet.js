import { meta } from "utils";


@meta.type("EveSOFDataHullDecalSet")
export class EveSOFDataHullDecalSet
{

    @meta.string
    name = "";

    @meta.list("EveSOFDataHullDecalSetItem")
    items = [];

    @meta.string
    visibilityGroup = "";

}
