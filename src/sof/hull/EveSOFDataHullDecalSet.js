import { meta } from "utils";


@meta.type("EveSOFDataHullDecalSet")
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
