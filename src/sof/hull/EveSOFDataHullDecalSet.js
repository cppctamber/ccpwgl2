import { meta } from "utils";


@meta.type("EveSOFDataHullDecalSet")
export class EveSOFDataHullDecalSet extends meta.Model
{

    @meta.string
    name = "";

    @meta.list("EveSOFDataHullDecalSetItem")
    items = [];

    @meta.string
    visibilityGroup = "";

}
