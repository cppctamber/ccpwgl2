import {vec2, vec4} from "../../global";
import {Tw2BaseClass} from "../../global";

/**
 * EveSOFDataGenericHullDamage
 *
 * @property {Number} hullParticleAngle               -
 * @property {vec4} hullParticleColor0                -
 * @property {vec4} hullParticleColor1                -
 * @property {vec4} hullParticleColor2                -
 * @property {Number} hullParticleColorMidpoint       -
 * @property {Number} hullParticleDrag                -
 * @property {vec2} hullParticleMinMaxLifeTime        -
 * @property {vec2} hullParticleMinMaxSpeed           -
 * @property {Number} hullParticleRate                -
 * @property {vec4} hullParticleSizes                 -
 * @property {Number} hullParticleTextureIndex        -
 * @property {Number} hullParticleTurbulenceAmplitude -
 * @property {Number} hullParticleTurbulenceFrequency -
 */
export default class EveSOFDataGenericHullDamage extends Tw2BaseClass
{

    hullParticleAngle = 0;
    hullParticleColor0 = vec4.create();
    hullParticleColor1 = vec4.create();
    hullParticleColor2 = vec4.create();
    hullParticleColorMidpoint = 0;
    hullParticleDrag = 0;
    hullParticleMinMaxLifeTime = vec2.create();
    hullParticleMinMaxSpeed = vec2.create();
    hullParticleRate = 0;
    hullParticleSizes = vec4.create();
    hullParticleTextureIndex = 0;
    hullParticleTurbulenceAmplitude = 0;
    hullParticleTurbulenceFrequency = 0;

}

Tw2BaseClass.define(EveSOFDataGenericHullDamage, Type =>
{
    return {
        isStaging: true,
        type: "EveSOFDataGenericHullDamage",
        props: {
            hullParticleAngle: Type.NUMBER,
            hullParticleColor0: Type.RGBA_LINEAR,
            hullParticleColor1: Type.RGBA_LINEAR,
            hullParticleColor2: Type.RGBA_LINEAR,
            hullParticleColorMidpoint: Type.NUMBER,
            hullParticleDrag: Type.NUMBER,
            hullParticleMinMaxLifeTime: Type.VECTOR2,
            hullParticleMinMaxSpeed: Type.VECTOR2,
            hullParticleRate: Type.NUMBER,
            hullParticleSizes: Type.VECTOR4,
            hullParticleTextureIndex: Type.NUMBER,
            hullParticleTurbulenceAmplitude: Type.NUMBER,
            hullParticleTurbulenceFrequency: Type.NUMBER
        }
    };
});

