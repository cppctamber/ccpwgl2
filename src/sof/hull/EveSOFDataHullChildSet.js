import { meta } from "utils";


@meta.type("EveSOFDataHullChildSet")
export class EveSOFDataHullChildSet extends meta.Model
{

    @meta.list("EveSOFDataHullChildSetItem")
    items = [];

}