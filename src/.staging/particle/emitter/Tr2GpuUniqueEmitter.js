import {vec3, vec4} from "../../../global";
import {Tw2BaseClass} from "../../class";

/**
 * Tr2GpuUniqueEmitter
 * @implements ParticleEmitterGPU
 *
 * @parameter {Number} angle                   -
 * @parameter {vec3} attractorPosition         -
 * @parameter {Number} attractorStrength       -
 * @parameter {vec4} color0                    -
 * @parameter {vec4} color1                    -
 * @parameter {vec4} color2                    -
 * @parameter {vec4} color3                    -
 * @parameter {Number} colorMidpoint           -
 * @parameter {Boolean} continuousEmitter      -
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
 * @parameter {Boolean} scaledByParent         -
 * @parameter {Number} sizeVariance            -
 * @parameter {vec3} sizes                     -
 * @parameter {Number} textureIndex            -
 * @parameter {Number} turbulenceAmplitude     -
 * @parameter {Number} turbulenceFrequency     -
 * @parameter {Number} velocityStretchRotation -
 */
export default class Tr2GpuUniqueEmitter extends Tw2BaseClass
{

    angle = 0;
    attractorPosition = vec3.create();
    attractorStrength = 0;
    color0 = vec4.create();
    color1 = vec4.create();
    color2 = vec4.create();
    color3 = vec4.create();
    colorMidpoint = 0;
    continuousEmitter = false;
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
    scaledByParent = false;
    sizeVariance = 0;
    sizes = vec3.create();
    textureIndex = 0;
    turbulenceAmplitude = 0;
    turbulenceFrequency = 0;
    velocityStretchRotation = 0;

}

Tw2BaseClass.define(Tr2GpuUniqueEmitter, Type =>
{
    return {
        isStaging: true,
        type: "Tr2GpuUniqueEmitter",
        category: "ParticleEmitterGPU",
        props: {
            angle: Type.NUMBER,
            attractorPosition: Type.TR_TRANSLATION,
            attractorStrength: Type.NUMBER,
            color0: Type.RGBA_LINEAR,
            color1: Type.RGBA_LINEAR,
            color2: Type.RGBA_LINEAR,
            color3: Type.RGBA_LINEAR,
            colorMidpoint: Type.NUMBER,
            continuousEmitter: Type.BOOLEAN,
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
            scaledByParent: Type.BOOLEAN,
            sizeVariance: Type.NUMBER,
            sizes: Type.VECTOR3,
            textureIndex: Type.NUMBER,
            turbulenceAmplitude: Type.NUMBER,
            turbulenceFrequency: Type.NUMBER,
            velocityStretchRotation: Type.NUMBER
        }
    };
});

