import { meta } from "utils";


@meta.type("EveSOFDataHullSpriteSet")
export class EveSOFDataHullSpriteSet
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
