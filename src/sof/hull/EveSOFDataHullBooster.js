import { meta } from "global";


@meta.type("EveSOFDataHullBooster", true)
export class EveSOFDataHullBooster
{

    @meta.black.boolean
    alwaysOn = false;

    @meta.black.boolean
    hasTrails = false;

    @meta.black.listOf("EveSOFDataHullBoosterItem")
    items = [];

}
