import { meta } from "utils";


@meta.type("EveSOFDataHullBannerSet")
export class EveSOFDataHullBannerSet extends meta.Model
{

    @meta.string
    name = "";

    @meta.list("EveSOFDataHullBannerSetItem")
    banners = [];

    @meta.string
    visibilityGroup = "";

}
