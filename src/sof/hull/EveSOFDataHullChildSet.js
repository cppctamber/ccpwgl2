import { meta } from "utils";


@meta.define("EveSOFDataHullChildSet", true)
export class EveSOFDataHullChildSet extends meta.Model
{

    @meta.string
    name = "";

    @meta.list("EveSOFDataHullChildSetItem")
    items = [];

    @meta.string
    visibilityGroup = "";

}