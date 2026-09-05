// Carbon Lights/Tr2SpotLight.h/.cpp and Tr2SpotLight_Blue.cpp.
// Authored fields remain flat; Tr2Light owns shared emitter behaviour.
import { meta } from "utils";
import { Tr2Light } from "../../eve/lights/Tr2Light";
import { vec3, vec4, quat } from "math";
import { PerLightShadowSetting, LIGHT_FLAG_DEFAULT } from "./Tw2CarbonLightMath";

@meta.define("Tr2SpotLight", true)
export class Tr2SpotLight extends Tr2Light
{
    type = 2;

    @meta.string
    name = "";

    @meta.int32
    boneIndex = -1;

    @meta.float
    brightness = 1;

    @meta.int32
    castsShadows = PerLightShadowSetting.DISABLED;

    @meta.color
    color = vec4.fromValues(0, 0, 0, 1);

    @meta.ushort
    flags = LIGHT_FLAG_DEFAULT;

    @meta.float
    innerAngle = 0;

    @meta.float
    innerRadius = 0;

    @meta.boolean
    isVolumetric = false;

    @meta.path
    lightProfilePath = "";

    @meta.float
    noiseAmplitude = 0;

    @meta.float
    noiseFrequency = 1;

    @meta.uint
    noiseOctaves = 1;

    @meta.float
    outerAngle = 0;

    @meta.vector3
    position = vec3.create();

    @meta.float
    radius = 0;

    @meta.quaternion
    rotation = quat.create();

}
