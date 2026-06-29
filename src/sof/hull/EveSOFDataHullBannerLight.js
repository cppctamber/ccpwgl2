import { meta } from "utils";


@meta.type("EveSOFDataHullBannerLight")
@meta.define({
    wgl: "EveSOFDataHullBannerLight",
    ccp: true
})
export class EveSOFDataHullBannerLight extends meta.Model
{

    @meta.float
    brightness = 0;

    @meta.float
    innerRadiusMultiplier = 0;

    @meta.float
    noiseAmplitude = 0;

    @meta.float
    noiseFrequency = 0;

    @meta.int32
    noiseOctaves = 0;

    @meta.float
    radiusMultiplier = 0;

    @meta.float
    saturation = 0;

}

