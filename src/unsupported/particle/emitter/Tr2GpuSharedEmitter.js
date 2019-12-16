import { meta, vec3, vec4 } from "global";
import { Tw2ParticleEmitter } from "particle/emitter/Tw2ParticleEmitter";


@meta.ccp("Tr2GpuSharedEmitter")
@meta.notImplemented
export class Tr2GpuSharedEmitter extends Tw2ParticleEmitter
{

    @meta.black.string
    name = "";

    @meta.black.float
    angle = 0;

    @meta.black.vector3
    attractorPosition = vec3.create();

    @meta.black.float
    attractorStrength = 0;

    @meta.black.color
    color0 = vec4.create();

    @meta.black.color
    color1 = vec4.create();

    @meta.black.color
    color2 = vec4.create();

    @meta.black.color
    color3 = vec4.create();

    @meta.black.float
    colorMidpoint = 0;

    @meta.black.boolean
    continuousEmitter = false;

    @meta.black.vector3
    direction = vec3.create();

    @meta.black.float
    drag = 0;

    @meta.black.float
    emissionDensity = 0;

    @meta.black.float
    gravity = 0;

    @meta.black.float
    inheritVelocity = 0;

    @meta.black.float
    innerAngle = 0;

    @meta.black.float
    maxDisplacement = 0;

    @meta.black.float
    maxEmissionDensity = 0;

    @meta.black.float
    maxLifeTime = 0;

    @meta.black.float
    maxSpeed = 0;

    @meta.black.float
    minLifeTime = 0;

    @meta.black.float
    minSpeed = 0;

    @meta.black.objectOf("Tr2GpuParticleSystem")
    particleSystem = null;

    @meta.black.vector3
    position = vec3.create();

    @meta.black.float
    radius = 0;

    @meta.black.float
    rate = 0;

    @meta.black.boolean
    scaledByParent = false;

    @meta.black.float
    sizeVariance = 0;

    @meta.black.vector3
    sizes = vec3.create();

    @meta.black.uint
    textureIndex = 0;

    @meta.black.float
    turbulenceAmplitude = 0;

    @meta.black.float
    turbulenceFrequency = 0;

    @meta.black.float
    velocityStretchRotation = 0;

}
