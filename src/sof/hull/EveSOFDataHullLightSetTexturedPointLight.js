import { meta } from "utils";
import { vec3 } from "math";


@meta.type("EveSOFDataHullLightSetTexturedPointLight")
export class EveSOFDataHullLightSetTexturedPointLight
{

    @meta.string
    name = "";

    @meta.float
    brightness = 0;

    @meta.float
    innerRadius = 0;

    @meta.vector3
    position = vec3.create();

    @meta.float
    noiseOctaves = 0;

    @meta.float
    radius = 0;

    @meta.path
    texturePath = "";

}
