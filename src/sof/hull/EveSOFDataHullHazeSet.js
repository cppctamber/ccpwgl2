import { meta } from "global/index";


@meta.ctor("EveSOFDataHullHazeSet")
export class EveSOFDataHullHazeSet
{

    @meta.string
    name = "";

    @meta.list("EveSOFDataHullHazeSetItem")
    items = [];

    @meta.string
    visibilityGroup = "";

}
