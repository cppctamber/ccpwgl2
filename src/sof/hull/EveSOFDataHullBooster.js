import { meta } from "utils";


@meta.type("EveSOFDataHullBooster")
export class EveSOFDataHullBooster extends meta.Model
{

    @meta.boolean
    alwaysOn = false;

    @meta.boolean
    hasTrails = false;

    @meta.list("EveSOFDataHullBoosterItem")
    items = [];

}
