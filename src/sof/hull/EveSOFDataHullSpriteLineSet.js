import { meta } from "utils";


@meta.define({
    wgl: "EveSOFDataHullSpriteLineSet",
    ccp: true
})
export class EveSOFDataHullSpriteLineSet extends meta.Model
{

    @meta.string
    name = "";

    @meta.list("EveSOFDataHullSpriteLineSetItem")
    items = [];

    @meta.boolean
    skinned = false;

    @meta.string
    visibilityGroup = "";

}
