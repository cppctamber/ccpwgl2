import {vec2, vec4} from "../../global";


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
export class EveSOFDataGenericHullDamage
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


    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            ["hullParticleAngle", r.float],
            ["hullParticleColor0", r.vector4],
            ["hullParticleColor1", r.vector4],
            ["hullParticleColor2", r.vector4],
            ["hullParticleColorMidpoint", r.float],
            ["hullParticleDrag", r.float],
            ["hullParticleMinMaxLifeTime", r.vector2],
            ["hullParticleMinMaxSpeed", r.vector2],
            ["hullParticleRate", r.float],
            ["hullParticleSizes", r.vector4],
            ["hullParticleTurbulenceAmplitude", r.float],
            ["hullParticleTurbulenceFrequency", r.float],
            ["hullParticleTextureIndex", r.uint],
        ];
    }
}