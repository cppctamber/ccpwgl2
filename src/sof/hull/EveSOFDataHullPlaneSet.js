import { meta } from "utils";
import { vec2, vec3 } from "math";


@meta.type("EveSOFDataHullPlaneSet")
export class EveSOFDataHullPlaneSet extends meta.Model
{

    @meta.string
    name = "";

    @meta.uint
    atlasSize = 0;

    @meta.vector2
    atlasAspectRatio = vec2.create();

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

    @meta.string
    visibilityGroup = "";

}
