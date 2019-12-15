import { meta, vec2, vec4 } from "global";


@meta.type("EveSOFDataGenericHullDamage", true)
export class EveSOFDataGenericHullDamage
{

    @meta.black.float
    hullParticleAngle = 0;

    @meta.black.color
    hullParticleColor0 = vec4.create();

    @meta.black.color
    hullParticleColor1 = vec4.create();

    @meta.black.color
    hullParticleColor2 = vec4.create();

    @meta.black.float
    hullParticleColorMidpoint = 0;

    @meta.black.float
    hullParticleDrag = 0;

    @meta.black.vector2
    hullParticleMinMaxLifeTime = vec2.create();

    @meta.black.vector2
    hullParticleMinMaxSpeed = vec2.create();

    @meta.black.float
    hullParticleRate = 0;

    @meta.black.vector4
    hullParticleSizes = vec4.create();

    @meta.black.uint
    hullParticleTextureIndex = 0;

    @meta.black.float
    hullParticleTurbulenceAmplitude = 0;

    @meta.black.float
    hullParticleTurbulenceFrequency = 0;

}
