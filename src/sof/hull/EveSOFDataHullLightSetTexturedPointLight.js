import { meta, vec3 } from "global";


@meta.type("EveSOFDataHullLightSetTexturedPointLight", true)
export class EveSOFDataHullLightSetTexturedPointLight
{

    @meta.black.string
    name = "";

    @meta.black.float
    brightness = 0;

    @meta.black.float
    innerRadius = 0;

    @meta.black.vector3
    position = vec3.create();

    @meta.black.float
    radius = 0;

    @meta.black.path
    texturePath = "";

}
