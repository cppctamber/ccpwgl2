import { meta } from "utils";


@meta.define("EveSOFDataHullSpriteLineSet", true)
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
