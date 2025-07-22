import { meta } from "utils";
import { vec3, vec4, quat } from "math";


@meta.notImplemented
@meta.type("Tr2SpotLight")
export class Tr2SpotLight extends meta.Model
{

    @meta.string
    name = "";

    @meta.float
    brightness = 0;

    @meta.vector4
    color = vec4.fromValues(0,0,0,1);

    @meta.float
    innerAngle = 0;

    @meta.float
    innerRadius = 0;

    @meta.string
    flags = "";

    @meta.float
    noiseAmplitude = 0;

    @meta.float
    noiseFrequency = 0;

    @meta.uint
    noiseOctaves = 0;

    @meta.path
    lightProfilePath = "";

    @meta.float
    outerAngle = 0;

    @meta.vector3
    position = vec3.create();

    @meta.float
    radius = 0;

    @meta.quaternion
    rotation = quat.create();

}
