import { meta, vec3, vec4 } from "global";
import { Tw2ParticleEmitter } from "./Tw2ParticleEmitter";


/**
 * Tr2GpuUniqueEmitter
 *
 * @property {String} name                         -
 * @property {Number} angle                        -
 * @property {vec3} attractorPosition              -
 * @property {Number} attractorStrength            -
 * @property {vec4} color0                         -
 * @property {vec4} color1                         -
 * @property {vec4} color2                         -
 * @property {vec4} color3                         -
 * @property {Number} colorMidpoint                -
 * @property {Boolean} continuousEmitter           -
 * @property {vec3} direction                      -
 * @property {Number} drag                         -
 * @property {Number} emissionDensity              -
 * @property {Number} gravity                      -
 * @property {Number} inheritVelocity              -
 * @property {Number} innerAngle                   -
 * @property {Number} maxDisplacement              -
 * @property {Number} maxEmissionDensity           -
 * @property {Number} maxLifeTime                  -
 * @property {Number} maxSpeed                     -
 * @property {Number} minLifeTime                  -
 * @property {Number} minSpeed                     -
 * @property {Tr2GpuParticleSystem} particleSystem -
 * @property {vec3} position                       -
 * @property {Number} radius                       -
 * @property {Number} rate                         -
 * @property {Boolean} scaledByParent              -
 * @property {Number} sizeVariance                 -
 * @property {vec3} sizes                          -
 * @property {Number} textureIndex                 -
 * @property {Number} turbulenceAmplitude          -
 * @property {Number} turbulenceFrequency          -
 * @property {Number} velocityStretchRotation      -
 */
@meta.ccp("Tr2GpuUniqueEmitter")
@meta.notImplemented
export class Tr2GpuUniqueEmitter extends Tw2ParticleEmitter
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

    @meta.black.object
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
