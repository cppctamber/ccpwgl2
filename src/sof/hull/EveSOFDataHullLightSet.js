import { meta } from "global";


@meta.type("EveSOFDataHullLightSet", true)
export class EveSOFDataHullLightSet
{

    @meta.black.string
    name = "";

    @meta.black.listOf("EveSOFDataHullLightSetItem")
    items = [];

    @meta.black.float
    noiseAmplitude = 0;

    @meta.black.float
    noiseOctaves = 0;

    @meta.black.string
    visibilityGroup = "";

}
