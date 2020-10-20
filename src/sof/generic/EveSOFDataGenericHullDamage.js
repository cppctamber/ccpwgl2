import { meta } from "utils";
import { vec2, vec4 } from "math";


@meta.type("EveSOFDataGenericHullDamage")
export class EveSOFDataGenericHullDamage
{

    @meta.float
    hullParticleAngle = 0;

    @meta.color
    hullParticleColor0 = vec4.create();

    @meta.color
    hullParticleColor1 = vec4.create();

    @meta.color
    hullParticleColor2 = vec4.create();

    @meta.float
    hullParticleColorMidpoint = 0;

    @meta.float
    hullParticleDrag = 0;

    @meta.vector2
    hullParticleMinMaxLifeTime = vec2.create();

    @meta.vector2
    hullParticleMinMaxSpeed = vec2.create();

    @meta.float
    hullParticleRate = 0;

    @meta.vector4
    hullParticleSizes = vec4.create();

    @meta.uint
    hullParticleTextureIndex = 0;

    @meta.float
    hullParticleTurbulenceAmplitude = 0;

    @meta.float
    hullParticleTurbulenceFrequency = 0;

}
