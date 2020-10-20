import { meta } from "utils";


@meta.type("EveSOFDataHullSpotlightSet")
export class EveSOFDataHullSpotlightSet
{

    @meta.string
    name = "";

    @meta.path
    coneTextureResPath = "";

    @meta.path
    glowTextureResPath = "";

    @meta.list("EveSOFDataHullSpotlightSetItem")
    items = [];

    @meta.boolean
    skinned = false;

    @meta.float
    zOffset = 0;

}
