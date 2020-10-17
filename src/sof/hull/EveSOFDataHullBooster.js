import { meta } from "utils";


@meta.ctor("EveSOFDataHullBooster")
export class EveSOFDataHullBooster
{

    @meta.boolean
    alwaysOn = false;

    @meta.boolean
    hasTrails = false;

    @meta.list("EveSOFDataHullBoosterItem")
    items = [];

}
