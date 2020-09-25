import { meta, vec3 } from "global";


@meta.ctor("EveSOFDataHullLightSetTexturedPointLight")
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
    radius = 0;

    @meta.path
    texturePath = "";

}
