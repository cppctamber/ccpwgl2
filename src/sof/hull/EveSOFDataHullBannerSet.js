import { meta } from "utils";


@meta.type("EveSOFDataHullBannerSet")
@meta.define({
    wgl: "EveSOFDataHullBannerSet",
    ccp: true
})
export class EveSOFDataHullBannerSet extends meta.Model
{

    @meta.string
    name = "";

    @meta.list("EveSOFDataHullBannerSetItem")
    banners = [];

    @meta.string
    visibilityGroup = "";

}
