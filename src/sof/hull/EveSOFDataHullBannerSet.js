import { meta } from "utils";


@meta.define("EveSOFDataHullBannerSet", true)
export class EveSOFDataHullBannerSet extends meta.Model
{

    @meta.string
    name = "";

    @meta.list("EveSOFDataHullBannerSetItem")
    banners = [];

    @meta.string
    visibilityGroup = "";

}
