import { meta } from "utils";


@meta.define("EveSOFDataHullDecalSet", true)
export class EveSOFDataHullDecalSet extends meta.Model
{

    @meta.string
    name = "";

    @meta.list("EveSOFDataHullDecalSetItem")
    items = [];

    @meta.string
    visibilityGroup = "";

}
