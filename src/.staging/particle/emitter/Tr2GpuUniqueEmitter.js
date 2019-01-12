import {vec3, vec4} from "../../../global";
import {Tw2BaseClass} from "../../../global";

/**
 * Tr2GpuUniqueEmitter
 * @implements ParticleEmitterGPU
 *
 * @property {Number} angle                   -
 * @property {vec3} attractorPosition         -
 * @property {Number} attractorStrength       -
 * @property {vec4} color0                    -
 * @property {vec4} color1                    -
 * @property {vec4} color2                    -
 * @property {vec4} color3                    -
 * @property {Number} colorMidpoint           -
 * @property {Boolean} continuousEmitter      -
 * @property {vec3} direction                 -
 * @property {Number} drag                    -
 * @property {Number} emissionDensity         -
 * @property {Number} gravity                 -
 * @property {Number} inheritVelocity         -
 * @property {Number} innerAngle              -
 * @property {Number} maxDisplacement         -
 * @property {Number} maxEmissionDensity      -
 * @property {Number} maxLifeTime             -
 * @property {Number} maxSpeed                -
 * @property {Number} minLifeTime             -
 * @property {Number} minSpeed                -
 * @property {vec3} position                  -
 * @property {Number} radius                  -
 * @property {Number} rate                    -
 * @property {Boolean} scaledByParent         -
 * @property {Number} sizeVariance            -
 * @property {vec3} sizes                     -
 * @property {Number} textureIndex            -
 * @property {Number} turbulenceAmplitude     -
 * @property {Number} turbulenceFrequency     -
 * @property {Number} velocityStretchRotation -
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

