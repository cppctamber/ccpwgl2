import {Tw2StagingClass} from "../class";

/**
 * Tw2ParticleSystem
 * @ccp Tr2ParticleSystem
 * @implements ParticleSystem
 *
 * @parameter {Boolean} applyAging                                               -
 * @parameter {Boolean} applyForce                                               -
 * @parameter {Array.<ParticleConstraint>} constraints                           -
 * @parameter {Array.<Tw2ParticleElementDeclaration>} elements                   -
 * @parameter {ParticleEmitter|ParticleEmitterGPU} emitParticleDuringLifeEmitter -
 * @parameter {ParticleEmitter|ParticleEmitterGPU} emitParticleOnDeathEmitter    -
 * @parameter {Array.<ParticleForce>} forces                                     -
 * @parameter {Number} maxParticleCount                                          -
 * @parameter {Boolean} requiresSorting                                          -
 * @parameter {Boolean} updateBoundingBox                                        -
 * @parameter {Boolean} updateSimulation                                         -
 * @parameter {Boolean} useSimTimeRebase                                         -
 */
export default class Tw2ParticleSystem extends Tw2StagingClass
{

    applyAging = false;
    applyForce = false;
    constraints = [];
    elements = [];
    emitParticleDuringLifeEmitter = null;
    emitParticleOnDeathEmitter = null;
    forces = [];
    maxParticleCount = 0;
    requiresSorting = false;
    updateBoundingBox = false;
    updateSimulation = false;
    useSimTimeRebase = false;

}

Tw2StagingClass.define(Tw2ParticleSystem, Type =>
{
    return {
        type: "Tw2ParticleSystem",
        category: "ParticleSystem",
        props: {
            applyAging: Type.BOOLEAN,
            applyForce: Type.BOOLEAN,
            constraints: [["Tw2PlaneConstraint"]],
            elements: [["Tw2ParticleElementDeclaration"]],
            emitParticleDuringLifeEmitter: ["Tw2DynamicEmitter", "Tw2GpuUniqueEmitter"],
            emitParticleOnDeathEmitter: ["Tw2DynamicEmitter", "Tw2GpuUniqueEmitter"],
            forces: Type.ARRAY,
            maxParticleCount: Type.NUMBER,
            requiresSorting: Type.BOOLEAN,
            updateBoundingBox: Type.BOOLEAN,
            updateSimulation: Type.BOOLEAN,
            useSimTimeRebase: Type.BOOLEAN
        }
    };
});

