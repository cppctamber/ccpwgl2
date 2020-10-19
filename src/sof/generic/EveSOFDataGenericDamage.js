import { meta } from "utils";
import { vec2, vec4 } from "math";


@meta.ctor("EveSOFDataGenericDamage")
export class EveSOFDataGenericDamage
{

    @meta.float
    armorParticleAngle = 0;

    @meta.color
    armorParticleColor0 = vec4.create();

    @meta.color
    armorParticleColor1 = vec4.create();

    @meta.color
    armorParticleColor2 = vec4.create();

    @meta.color
    armorParticleColor3 = vec4.create();

    @meta.float
    armorParticleDrag = 0;

    @meta.vector2
    armorParticleMinMaxLifeTime = vec2.create();

    @meta.vector2
    armorParticleMinMaxSpeed = vec2.create();

    @meta.float
    armorParticleRate = 0;

    @meta.vector4
    armorParticleSizes = vec4.create();

    @meta.uint
    armorParticleTextureIndex = 0;

    @meta.float
    armorParticleTurbulenceAmplitude = 0;

    @meta.float
    armorParticleTurbulenceFrequency = 0;

    @meta.float
    armorParticleVelocityStretchRotation = 0;

    @meta.string
    armorShader = "";

    @meta.float
    flickerPerlinAlpha = 0;

    @meta.float
    flickerPerlinBeta = 0;

    @meta.uint
    flickerPerlinN = 0;

    @meta.float
    flickerPerlinSpeed = 0;

    @meta.path
    shieldGeometryResFilePath = "";

    @meta.string
    shieldShaderEllipsoid = "";

    @meta.string
    shieldShaderHull = "";

}
