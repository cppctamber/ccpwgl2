import { meta } from "utils";


@meta.define("EveSOFDataHullBannerLight", true)
export class EveSOFDataHullBannerLight extends meta.Model
{

    @meta.float
    brightness = 1;

    @meta.float
    innerRadiusMultiplier = 0.3;

    @meta.float
    noiseAmplitude = 0;

    @meta.float
    noiseFrequency = 1;

    @meta.int32
    noiseOctaves = 1;

    @meta.float
    radiusMultiplier = 1;

    @meta.float
    saturation = 1;

}

