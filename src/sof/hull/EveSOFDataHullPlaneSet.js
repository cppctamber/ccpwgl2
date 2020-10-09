import { meta } from "global";


@meta.ctor("EveSOFDataHullPlaneSet")
export class EveSOFDataHullPlaneSet
{

    @meta.string
    name = "";

    @meta.uint
    atlasSize = 0;

    @meta.list("EveSOFDataHullPlaneSetItem")
    items = [];

    @meta.path
    layer1MapResPath = "";

    @meta.path
    layer2MapResPath = "";

    @meta.path
    maskMapResPath = "";

    @meta.boolean
    skinned = false;

    @meta.notImplemented
    @meta.uint
    usage = 0;

}
