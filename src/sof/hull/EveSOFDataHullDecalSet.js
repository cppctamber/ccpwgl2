import { meta } from "utils";


@meta.ctor("EveSOFDataHullDecalSet")
export class EveSOFDataHullDecalSet
{

    @meta.string
    name = "";

    @meta.list("EveSOFDataHullDecalSetItem")
    items = [];

    @meta.string
    visibilityGroup = "";

}
