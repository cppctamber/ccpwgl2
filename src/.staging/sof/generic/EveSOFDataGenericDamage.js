import {vec2, vec4} from "../../../global";
import {Tw2BaseClass} from "../../class";

/**
 * EveSOFDataGenericDamage
 *
 * @parameter {Number} armorParticleAngle                   -
 * @parameter {vec4} armorParticleColor0                    -
 * @parameter {vec4} armorParticleColor1                    -
 * @parameter {vec4} armorParticleColor2                    -
 * @parameter {vec4} armorParticleColor3                    -
 * @parameter {Number} armorParticleDrag                    -
 * @parameter {vec2} armorParticleMinMaxLifeTime            -
 * @parameter {vec2} armorParticleMinMaxSpeed               -
 * @parameter {Number} armorParticleRate                    -
 * @parameter {vec4} armorParticleSizes                     -
 * @parameter {Number} armorParticleTextureIndex            -
 * @parameter {Number} armorParticleTurbulenceAmplitude     -
 * @parameter {Number} armorParticleTurbulenceFrequency     -
 * @parameter {Number} armorParticleVelocityStretchRotation -
 * @parameter {String} armorShader                          -
 * @parameter {Number} flickerPerlinAlpha                   -
 * @parameter {Number} flickerPerlinBeta                    -
 * @parameter {Number} flickerPerlinN                       -
 * @parameter {Number} flickerPerlinSpeed                   -
 * @parameter {String} shieldGeometryResFilePath            -
 * @parameter {String} shieldShaderEllipsoid                -
 * @parameter {String} shieldShaderHull                     -
 */
export default class EveSOFDataGenericDamage extends Tw2BaseClass
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

