import { meta } from "utils";


@meta.type("EveSOFDataHullChildSet")
export class EveSOFDataHullChildSet extends meta.Model
{

    @meta.string
    name = "";

    @meta.list("EveSOFDataHullChildSetItem")
    items = [];

    @meta.string
    visibilityGroup = "";

}