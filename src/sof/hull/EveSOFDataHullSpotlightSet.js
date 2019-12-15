import { meta } from "global";


@meta.type("EveSOFDataHullSpotlightSet", true)
export class EveSOFDataHullSpotlightSet
{

    @meta.black.string
    name = "";

    @meta.black.path
    coneTextureResPath = "";

    @meta.black.path
    glowTextureResPath = "";

    @meta.black.listOf("EveSOFDataHullSpotlightSetItem")
    items = [];

    @meta.black.boolean
    skinned = false;

    @meta.black.float
    zOffset = 0;

}
