import {Tw2BaseClass} from "../../../global";

/**
 * EveMissileWarhead
 *
 * @property {Number} acceleration                         -
 * @property {Number} durationEjectPhase                   -
 * @property {Number} impactDuration                       -
 * @property {Number} impactSize                           -
 * @property {Number} maxExplosionDistance                 -
 * @property {Tr2Mesh} mesh                                -
 * @property {Array.<ParticleEmitterGPU>} particleEmitters -
 * @property {Number} pathOffsetNoiseScale                 -
 * @property {Number} pathOffsetNoiseSpeed                 -
 * @property {EveSpriteSet} spriteSet                      -
 * @property {Number} startEjectVelocity                   -
 * @property {Number} warheadLength                        -
 * @property {Number} warheadRadius                        -
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

