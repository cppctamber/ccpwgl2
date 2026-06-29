import { meta } from "utils";


@meta.type("EveSOFDataHullHazeSet")
@meta.define({
    wgl: "EveSOFDataHullHazeSet",
    ccp: true
})
export class EveSOFDataHullHazeSet extends meta.Model
{

    @meta.string
    name = "";

    @meta.list("EveSOFDataHullHazeSetItem")
    items = [];

    @meta.uint
    hazeType = 0;

    @meta.string
    visibilityGroup = "";

    @meta.boolean
    skinned = false;

}
