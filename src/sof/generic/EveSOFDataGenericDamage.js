import { meta, vec2, vec4 } from "global";


@meta.type("EveSOFDataGenericDamage", true)
export class EveSOFDataGenericDamage
{

    @meta.black.float
    armorParticleAngle = 0;

    @meta.black.color
    armorParticleColor0 = vec4.create();

    @meta.black.color
    armorParticleColor1 = vec4.create();

    @meta.black.color
    armorParticleColor2 = vec4.create();

    @meta.black.color
    armorParticleColor3 = vec4.create();

    @meta.black.float
    armorParticleDrag = 0;

    @meta.black.vector2
    armorParticleMinMaxLifeTime = vec2.create();

    @meta.black.vector2
    armorParticleMinMaxSpeed = vec2.create();

    @meta.black.float
    armorParticleRate = 0;

    @meta.black.vector4
    armorParticleSizes = vec4.create();

    @meta.black.uint
    armorParticleTextureIndex = 0;

    @meta.black.float
    armorParticleTurbulenceAmplitude = 0;

    @meta.black.float
    armorParticleTurbulenceFrequency = 0;

    @meta.black.float
    armorParticleVelocityStretchRotation = 0;

    @meta.black.string
    armorShader = "";

    @meta.black.float
    flickerPerlinAlpha = 0;

    @meta.black.float
    flickerPerlinBeta = 0;

    @meta.black.uint
    flickerPerlinN = 0;

    @meta.black.float
    flickerPerlinSpeed = 0;

    @meta.black.path
    shieldGeometryResFilePath = "";

    @meta.black.string
    shieldShaderEllipsoid = "";

    @meta.black.string
    shieldShaderHull = "";

}
