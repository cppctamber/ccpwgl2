import { meta } from "utils";
import { vec3, vec4 } from "math";
import { Tw2ParticleEmitter } from "particle/emitter/Tw2ParticleEmitter";


@meta.type("Tr2GpuUniqueEmitter")
@meta.notImplemented
export class Tr2GpuUniqueEmitter extends Tw2ParticleEmitter
{

    @meta.string
    name = "";

    @meta.float
    angle = 0;

    @meta.vector3
    attractorPosition = vec3.create();

    @meta.float
    attractorStrength = 0;

    @meta.color
    color0 = vec4.create();

    @meta.color
    color1 = vec4.create();

    @meta.color
    color2 = vec4.create();

    @meta.color
    color3 = vec4.create();

    @meta.float
    colorMidpoint = 0;

    @meta.boolean
    continuousEmitter = false;

    @meta.vector3
    direction = vec3.create();

    @meta.float
    drag = 0;

    @meta.float
    emissionDensity = 0;

    @meta.float
    gravity = 0;

    @meta.float
    inheritVelocity = 0;

    @meta.float
    innerAngle = 0;

    @meta.float
    maxDisplacement = 0;

    @meta.float
    maxEmissionDensity = 0;

    @meta.float
    maxLifeTime = 0;

    @meta.float
    maxSpeed = 0;

    @meta.float
    minLifeTime = 0;

    @meta.float
    minSpeed = 0;

    @meta.struct("Tr2GpuParticleSystem")
    particleSystem = null;

    @meta.vector3
    position = vec3.create();

    @meta.float
    radius = 0;

    @meta.float
    rate = 0;

    @meta.boolean
    scaledByParent = false;

    @meta.float
    sizeVariance = 0;

    @meta.vector3
    sizes = vec3.create();

    @meta.uint
    textureIndex = 0;

    @meta.float
    turbulenceAmplitude = 0;

    @meta.float
    turbulenceFrequency = 0;

    @meta.float
    velocityStretchRotation = 0;

}
