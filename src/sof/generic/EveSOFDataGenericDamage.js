import {vec2, vec4} from "../../global";
import {Tw2BaseClass} from "../../global";

/**
 * EveSOFDataGenericDamage
 *
 * @property {Number} armorParticleAngle                   -
 * @property {vec4} armorParticleColor0                    -
 * @property {vec4} armorParticleColor1                    -
 * @property {vec4} armorParticleColor2                    -
 * @property {vec4} armorParticleColor3                    -
 * @property {Number} armorParticleDrag                    -
 * @property {vec2} armorParticleMinMaxLifeTime            -
 * @property {vec2} armorParticleMinMaxSpeed               -
 * @property {Number} armorParticleRate                    -
 * @property {vec4} armorParticleSizes                     -
 * @property {Number} armorParticleTextureIndex            -
 * @property {Number} armorParticleTurbulenceAmplitude     -
 * @property {Number} armorParticleTurbulenceFrequency     -
 * @property {Number} armorParticleVelocityStretchRotation -
 * @property {String} armorShader                          -
 * @property {Number} flickerPerlinAlpha                   -
 * @property {Number} flickerPerlinBeta                    -
 * @property {Number} flickerPerlinN                       -
 * @property {Number} flickerPerlinSpeed                   -
 * @property {String} shieldGeometryResFilePath            -
 * @property {String} shieldShaderEllipsoid                -
 * @property {String} shieldShaderHull                     -
 */
export class EveSOFDataGenericDamage extends Tw2BaseClass
{

    armorParticleAngle = 0;
    armorParticleColor0 = vec4.create();
    armorParticleColor1 = vec4.create();
    armorParticleColor2 = vec4.create();
    armorParticleColor3 = vec4.create();
    armorParticleDrag = 0;
    armorParticleMinMaxLifeTime = vec2.create();
    armorParticleMinMaxSpeed = vec2.create();
    armorParticleRate = 0;
    armorParticleSizes = vec4.create();
    armorParticleTextureIndex = 0;
    armorParticleTurbulenceAmplitude = 0;
    armorParticleTurbulenceFrequency = 0;
    armorParticleVelocityStretchRotation = 0;
    armorShader = "";
    flickerPerlinAlpha = 0;
    flickerPerlinBeta = 0;
    flickerPerlinN = 0;
    flickerPerlinSpeed = 0;
    shieldGeometryResFilePath = "";
    shieldShaderEllipsoid = "";
    shieldShaderHull = "";

}

Tw2BaseClass.define(EveSOFDataGenericDamage, Type =>
{
    return {
        isStaging: true,
        type: "EveSOFDataGenericDamage",
        props: {
            armorParticleAngle: Type.NUMBER,
            armorParticleColor0: Type.RGBA_LINEAR,
            armorParticleColor1: Type.RGBA_LINEAR,
            armorParticleColor2: Type.RGBA_LINEAR,
            armorParticleColor3: Type.RGBA_LINEAR,
            armorParticleDrag: Type.NUMBER,
            armorParticleMinMaxLifeTime: Type.VECTOR2,
            armorParticleMinMaxSpeed: Type.VECTOR2,
            armorParticleRate: Type.NUMBER,
            armorParticleSizes: Type.VECTOR4,
            armorParticleTextureIndex: Type.NUMBER,
            armorParticleTurbulenceAmplitude: Type.NUMBER,
            armorParticleTurbulenceFrequency: Type.NUMBER,
            armorParticleVelocityStretchRotation: Type.NUMBER,
            armorShader: Type.STRING,
            flickerPerlinAlpha: Type.NUMBER,
            flickerPerlinBeta: Type.NUMBER,
            flickerPerlinN: Type.NUMBER,
            flickerPerlinSpeed: Type.NUMBER,
            shieldGeometryResFilePath: Type.PATH,
            shieldShaderEllipsoid: Type.STRING,
            shieldShaderHull: Type.STRING
        }
    };
});

