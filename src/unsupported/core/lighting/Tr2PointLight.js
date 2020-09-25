import { meta, vec3, vec4, Tw2BaseClass } from "global";


@meta.notImplemented
@meta.ctor("Tr2PointLight")
export class Tr2PointLight extends Tw2BaseClass
{

    @meta.string
    name = "";

    @meta.float
    brightness = 0;

    @meta.color
    color = vec4.create();

    @meta.float
    innerRadius = 0;

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
