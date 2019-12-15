import { meta } from "global";


@meta.type("EveSOFDataHullSpriteLineSet", true)
export class EveSOFDataHullSpriteLineSet
{

    @meta.black.string
    name = "";

    @meta.black.listOf("EveSOFDataHullSpriteLineSetItem")
    items = [];

    @meta.black.boolean
    skinned = false;

    @meta.black.string
    visibilityGroup = "";

}
