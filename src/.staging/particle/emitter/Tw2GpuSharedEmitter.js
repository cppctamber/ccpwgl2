import {vec3, vec4} from "../../../global";
import {Tw2StagingClass} from "../../class";

/**
 * Tw2GpuSharedEmitter
 * @ccp Tr2GpuSharedEmitter
 * @implements ParticleEmitterGPU
 *
 * @parameter {Number} angle                   -
 * @parameter {vec4} color0                    -
 * @parameter {vec4} color1                    -
 * @parameter {vec4} color2                    -
 * @parameter {vec4} color3                    -
 * @parameter {Number} colorMidpoint           -
 * @parameter {vec3} direction                 -
 * @parameter {Number} drag                    -
 * @parameter {Number} emissionDensity         -
 * @parameter {Number} gravity                 -
 * @parameter {Number} inheritVelocity         -
 * @parameter {Number} innerAngle              -
 * @parameter {Number} maxDisplacement         -
 * @parameter {Number} maxEmissionDensity      -
 * @parameter {Number} maxLifeTime             -
 * @parameter {Number} maxSpeed                -
 * @parameter {Number} minLifeTime             -
 * @parameter {Number} minSpeed                -
 * @parameter {vec3} position                  -
 * @parameter {Number} radius                  -
 * @parameter {Number} rate                    -
 * @parameter {Number} sizeVariance            -
 * @parameter {vec3} sizes                     -
 * @parameter {Number} textureIndex            -
 * @parameter {Number} turbulenceAmplitude     -
 * @parameter {Number} turbulenceFrequency     -
 * @parameter {Number} velocityStretchRotation -
 */
export default class Tw2GpuSharedEmitter extends Tw2StagingClass
{

    angle = 0;
    color0 = vec4.create();
    color1 = vec4.create();
    color2 = vec4.create();
    color3 = vec4.create();
    colorMidpoint = 0;
    direction = vec3.create();
    drag = 0;
    emissionDensity = 0;
    gravity = 0;
    inheritVelocity = 0;
    innerAngle = 0;
    maxDisplacement = 0;
    maxEmissionDensity = 0;
    maxLifeTime = 0;
    maxSpeed = 0;
    minLifeTime = 0;
    minSpeed = 0;
    position = vec3.create();
    radius = 0;
    rate = 0;
    sizeVariance = 0;
    sizes = vec3.create();
    textureIndex = 0;
    turbulenceAmplitude = 0;
    turbulenceFrequency = 0;
    velocityStretchRotation = 0;

}

Tw2StagingClass.define(Tw2GpuSharedEmitter, Type =>
{
    return {
        type: "Tw2GpuSharedEmitter",
        category: "ParticleEmitterGPU",
        props: {
            angle: Type.NUMBER,
            color0: Type.RGBA_LINEAR,
            color1: Type.RGBA_LINEAR,
            color2: Type.RGBA_LINEAR,
            color3: Type.RGBA_LINEAR,
            colorMidpoint: Type.NUMBER,
            direction: Type.VECTOR3,
            drag: Type.NUMBER,
            emissionDensity: Type.NUMBER,
            gravity: Type.NUMBER,
            inheritVelocity: Type.NUMBER,
            innerAngle: Type.NUMBER,
            maxDisplacement: Type.NUMBER,
            maxEmissionDensity: Type.NUMBER,
            maxLifeTime: Type.NUMBER,
            maxSpeed: Type.NUMBER,
            minLifeTime: Type.NUMBER,
            minSpeed: Type.NUMBER,
            position: Type.TR_TRANSLATION,
            radius: Type.NUMBER,
            rate: Type.NUMBER,
            sizeVariance: Type.NUMBER,
            sizes: Type.VECTOR3,
            textureIndex: Type.NUMBER,
            turbulenceAmplitude: Type.NUMBER,
            turbulenceFrequency: Type.NUMBER,
            velocityStretchRotation: Type.NUMBER
        }
    };
});

