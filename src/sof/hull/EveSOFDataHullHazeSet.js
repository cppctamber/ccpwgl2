import { meta } from "global/index";


@meta.type("EveSOFDataHullHazeSet", true)
export class EveSOFDataHullHazeSet
{

    @meta.black.string
    name = "";

    @meta.black.listOf("EveSOFDataHullHazeSetItem")
    items = [];

    @meta.black.string
    visibilityGroup = "";

}
