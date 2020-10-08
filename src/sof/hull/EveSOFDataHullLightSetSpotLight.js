import { meta, vec3, vec4, quat } from "global";


@meta.ctor("EveSOFDataHullLightSetSpotLight")
export class EveSOFDataHullLightSetSpotLight
{

    @meta.string
    name = "";

    @meta.uint
    boneIndex = -1;

    @meta.float
    brightness = 0;

    @meta.float
    innerAngle = 0;

    @meta.float
    innerRadius = 0;

    @meta.color
    lightColor = vec4.create();

    @meta.float
    noiseAmplitude = 0;

    @meta.float
    noiseFrequency = 0;

    @meta.float
    outerAngle = 0;

    @meta.vector3
    position = vec3.create();

    @meta.uint
    radius = 0;

    @meta.quaternion
    rotation = quat.create();

}
