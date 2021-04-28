import { meta } from "utils";


@meta.type("EveSOFDataHullSpriteLineSet")
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
