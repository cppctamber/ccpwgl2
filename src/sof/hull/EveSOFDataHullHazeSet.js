import { meta } from "utils";


@meta.type("EveSOFDataHullHazeSet")
export class EveSOFDataHullHazeSet
{

    @meta.string
    name = "";

    @meta.list("EveSOFDataHullHazeSetItem")
    items = [];

    @meta.string
    visibilityGroup = "";

}
