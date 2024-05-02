import { meta } from "utils";
import { vec3, quat } from "math";


@meta.type("EveSOFDataPointLightAttachment")
export class EveSOFDataPointLightAttachment extends meta.Model
{

    @meta.float
    intensity = 0.0;

    @meta.float
    innerScaleMultiplier = 0.0;

    @meta.path
    lightProfilePath = 0.0;

    @meta.float
    noiseAmplitude = 0.0;

    @meta.float
    noiseFrequency = 0.0;

    @meta.uint
    noiseOctaves = 0;

    @meta.float
    outerScaleMultiplier = 0.0;

    @meta.vector3
    translation = vec3.create();

    @meta.quaternion
    rotation = quat.create();


    @meta.float
    saturation = 0.0;

}