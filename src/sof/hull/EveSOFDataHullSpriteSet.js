import { meta } from "utils";


@meta.type("EveSOFDataHullSpriteSet")
@meta.define({
    wgl: "EveSOFDataHullSpriteSet",
    ccp: true
})
export class EveSOFDataHullSpriteSet extends meta.Model
{

    @meta.string
    name = "";

    @meta.list("EveSOFDataHullSpriteSetItem")
    items = [];

    @meta.boolean
    skinned = false;

    @meta.string
    visibilityGroup = "";

}
