import { meta } from "utils";


@meta.ctor("EveSOFDataHullLightSet")
export class EveSOFDataHullLightSet
{

    @meta.string
    name = "";

    @meta.uint
    boneIndex = -1;

    @meta.list("EveSOFDataHullLightSetItem")
    items = [];

    @meta.float
    noiseAmplitude = 0;

    @meta.float
    noiseOctaves = 0;

    @meta.string
    visibilityGroup = "";

}
