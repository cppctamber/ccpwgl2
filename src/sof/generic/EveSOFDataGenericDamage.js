import { meta } from "utils";
import { vec2, vec4 } from "math";


@meta.type("EveSOFDataGenericDamage")
@meta.define({
    wgl: "EveSOFDataGenericDamage",
    ccp: true
})
export class EveSOFDataGenericDamage extends meta.Model
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
    armorParticleColorMidPoint = 0.5;

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

    @meta.uint
    armorParticleTurbulenceFrequency = 1;

    @meta.float
    armorParticleVelocityStretchRotation = 0;

    @meta.string
    armorShader = "";

    @meta.float
    flickerPerlinAlpha = 1.1;

    @meta.float
    flickerPerlinBeta = 2;

    @meta.uint
    flickerPerlinN = 3;

    @meta.float
    flickerPerlinSpeed = 1;

    @meta.path
    shieldGeometryResFilePath = "";

    @meta.string
    shieldShaderEllipsoid = "";

    @meta.string
    shieldShaderHull = "";

}
