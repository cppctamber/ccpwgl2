import { vec3, vec4 } from "../../global";
import { Tw2ParticleEmitter } from "./Tw2ParticleEmitter";

/**
 * Tr2GpuSharedEmitter
 * TODO: Implement
 * @ccp Tr2GpuSharedEmitter
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
 * @property {Tw2GpuParticleSystem} particleSystem -
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
export class Tr2GpuSharedEmitter extends Tw2ParticleEmitter
{
    // ccp
    name = "";
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
    particleSystem = null;
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

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            [ "name", r.string ],
            [ "particleSystem", r.object ],
            [ "angle", r.float ],
            [ "attractorPosition", r.vector3 ],
            [ "attractorStrength", r.float ],
            [ "color0", r.vector4 ],
            [ "color1", r.vector4 ],
            [ "color2", r.vector4 ],
            [ "color3", r.vector4 ],
            [ "colorMidpoint", r.float ],
            [ "continuousEmitter", r.boolean ],
            [ "direction", r.vector3 ],
            [ "drag", r.float ],
            [ "emissionDensity", r.float ],
            [ "gravity", r.float ],
            [ "maxDisplacement", r.float ],
            [ "maxEmissionDensity", r.float ],
            [ "maxLifeTime", r.float ],
            [ "maxSpeed", r.float ],
            [ "minLifeTime", r.float ],
            [ "minSpeed", r.float ],
            [ "position", r.vector3 ],
            [ "inheritVelocity", r.float ],
            [ "innerAngle", r.float ],
            [ "radius", r.float ],
            [ "rate", r.float ],
            [ "sizeVariance", r.float ],
            [ "sizes", r.vector3 ],
            [ "scaledByParent", r.boolean ],
            [ "textureIndex", r.uint ],
            [ "turbulenceAmplitude", r.float ],
            [ "turbulenceFrequency", r.float ],
            [ "velocityStretchRotation", r.float ],
        ];
    }

    /**
     * Identifies that the class is in staging
     * @property {null|Number}
     */
    static __isStaging = 4;

}
