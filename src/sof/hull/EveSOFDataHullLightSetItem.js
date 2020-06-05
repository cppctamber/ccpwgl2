import { meta, vec3, vec4 } from "global";


@meta.type("EveSOFDataHullLightSetItem", true)
export class EveSOFDataHullLightSetItem
{

    @meta.black.string
    name = "";

    @meta.black.float
    brightness = 0;

    @meta.black.float
    innerRadius = 0;

    @meta.black.color
    lightColor = vec4.create();

    @meta.black.float
    noiseAmplitude = 0;

    @meta.black.float
    noiseFrequency = 0;

    @meta.black.float
    noiseOctaves = 0;

    @meta.black.vector3
    position = vec3.create();

    @meta.black.float
    radius = 0;

}
