import { meta } from "global";


@meta.type("EveSOFDataHullSpriteSet", true)
export class EveSOFDataHullSpriteSet
{

    @meta.black.string
    name = "";

    @meta.black.listOf("EveSOFDataHullSpriteSetItem")
    items = [];

    @meta.black.boolean
    skinned = false;

    @meta.black.string
    visibilityGroup = "";

}
