import { meta } from "utils";


@meta.type("EveSOFDataHullHazeSet")
export class EveSOFDataHullHazeSet extends meta.Model
{

    @meta.string
    name = "";

    @meta.list("EveSOFDataHullHazeSetItem")
    items = [];

    @meta.string
    visibilityGroup = "";

    @meta.boolean
    skinned = false;

}
