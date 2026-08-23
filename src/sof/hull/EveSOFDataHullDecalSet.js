import { meta } from "utils";


@meta.define({
    wgl: "EveSOFDataHullDecalSet",
    ccp: true
})
export class EveSOFDataHullDecalSet extends meta.Model
{

    @meta.string
    name = "";

    @meta.list("EveSOFDataHullDecalSetItem")
    items = [];

    @meta.string
    visibilityGroup = "";

}
