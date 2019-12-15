import { meta, vec3, vec4, quat } from "global";


@meta.type("EveSOFDataHullLightSetSpotLight", true)
export class EveSOFDataHullLightSetSpotLight
{

    @meta.black.string
    name = "";

    @meta.black.float
    brightness = 0;

    @meta.black.float
    innerAngle = 0;

    @meta.black.float
    innerRadius = 0;

    @meta.black.color
    lightColor = vec4.create();

    @meta.black.float
    outerAngle = 0;

    @meta.black.vector3
    position = vec3.create();

    @meta.black.uint
    radius = 0;

    @meta.black.quaternion
    rotation = quat.create();

}
