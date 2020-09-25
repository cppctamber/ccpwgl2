import { meta } from "global";


@meta.ctor("EveSOFDataHullSpriteSet")
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
