import {vec2, vec4} from "../../global";


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
export class EveSOFDataGenericDamage
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

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            ["armorParticleAngle", r.float],
            ["armorParticleColor0", r.vector4],
            ["armorParticleColor1", r.vector4],
            ["armorParticleColor2", r.vector4],
            ["armorParticleColor3", r.vector4],
            ["armorParticleDrag", r.float],
            ["armorParticleMinMaxLifeTime", r.vector2],
            ["armorParticleMinMaxSpeed", r.vector2],
            ["armorParticleRate", r.float],
            ["armorParticleSizes", r.vector4],
            ["armorParticleTurbulenceAmplitude", r.float],
            ["armorParticleTurbulenceFrequency", r.float],
            ["armorParticleVelocityStretchRotation", r.float],
            ["armorParticleTextureIndex", r.uint],
            ["armorShader", r.string],
            ["flickerPerlinAlpha", r.float],
            ["flickerPerlinBeta", r.float],
            ["flickerPerlinSpeed", r.float],
            ["flickerPerlinN", r.uint],
            ["shieldGeometryResFilePath", r.path],
            ["shieldShaderEllipsoid", r.string],
            ["shieldShaderHull", r.string],
        ];
    }
}