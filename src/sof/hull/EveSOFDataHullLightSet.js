import { meta } from "utils";


@meta.define("EveSOFDataHullLightSet", true)
export class EveSOFDataHullLightSet extends meta.Model
{

    @meta.string
    name = "";

    @meta.int32
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
