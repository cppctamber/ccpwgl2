import { meta } from "global";


@meta.type("EveSOFDataHullPlaneSet", true)
export class EveSOFDataHullPlaneSet
{

    @meta.black.string
    name = "";

    @meta.black.uint
    atlasSize = 0;

    @meta.black.listOf("EveSOFDataHullPlaneSetItem")
    items = [];

    @meta.black.path
    layer1MapResPath = "";

    @meta.black.path
    layer2MapResPath = "";

    @meta.black.path
    maskMapResPath = "";

    @meta.black.boolean
    skinned = false;

    @meta.black.uint
    usage = 0;

}
