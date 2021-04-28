import { meta } from "utils";
import { vec3, vec4 } from "math";


@meta.type("EveSOFDataHullLightSetItem")
export class EveSOFDataHullLightSetItem extends meta.Model
{

    @meta.string
    name = "";

    @meta.uint
    boneIndex = -1;

    @meta.float
    brightness = 0;

    @meta.float
    innerRadius = 0;

    @meta.color
    lightColor = vec4.create();

    @meta.float
    noiseAmplitude = 0;

    @meta.float
    noiseFrequency = 0;

    @meta.float
    noiseOctaves = 0;

    @meta.vector3
    position = vec3.create();

    @meta.float
    radius = 0;

}
