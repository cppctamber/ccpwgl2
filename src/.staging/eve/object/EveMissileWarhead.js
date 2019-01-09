import {Tw2BaseClass} from "../../class";

/**
 * EveMissileWarhead
 *
 * @parameter {Number} acceleration                         -
 * @parameter {Number} durationEjectPhase                   -
 * @parameter {Number} impactDuration                       -
 * @parameter {Number} impactSize                           -
 * @parameter {Number} maxExplosionDistance                 -
 * @parameter {Tr2Mesh} mesh                                -
 * @parameter {Array.<ParticleEmitterGPU>} particleEmitters -
 * @parameter {Number} pathOffsetNoiseScale                 -
 * @parameter {Number} pathOffsetNoiseSpeed                 -
 * @parameter {EveSpriteSet} spriteSet                      -
 * @parameter {Number} startEjectVelocity                   -
 * @parameter {Number} warheadLength                        -
 * @parameter {Number} warheadRadius                        -
 */
export default class EveMissileWarhead extends Tw2BaseClass
{

    acceleration = 0;
    durationEjectPhase = 0;
    impactDuration = 0;
    impactSize = 0;
    maxExplosionDistance = 0;
    mesh = null;
    particleEmitters = [];
    pathOffsetNoiseScale = 0;
    pathOffsetNoiseSpeed = 0;
    spriteSet = null;
    startEjectVelocity = 0;
    warheadLength = 0;
    warheadRadius = 0;

}

Tw2BaseClass.define(EveMissileWarhead, Type =>
{
    return {
        isStaging: true,
        type: "EveMissileWarhead",
        props: {
            acceleration: Type.NUMBER,
            durationEjectPhase: Type.NUMBER,
            impactDuration: Type.NUMBER,
            impactSize: Type.NUMBER,
            maxExplosionDistance: Type.NUMBER,
            mesh: ["Tr2Mesh"],
            particleEmitters: [["Tr2GpuSharedEmitter"]],
            pathOffsetNoiseScale: Type.NUMBER,
            pathOffsetNoiseSpeed: Type.NUMBER,
            spriteSet: ["EveSpriteSet"],
            startEjectVelocity: Type.NUMBER,
            warheadLength: Type.NUMBER,
            warheadRadius: Type.NUMBER
        }
    };
});

