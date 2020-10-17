import { meta } from "utils";


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
