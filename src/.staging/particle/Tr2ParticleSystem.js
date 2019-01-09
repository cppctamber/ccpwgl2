import {Tw2BaseClass} from "../class";

/**
 * Tr2ParticleSystem
 * @implements ParticleSystem
 *
 * @parameter {Boolean} applyAging                                               -
 * @parameter {Boolean} applyForce                                               -
 * @parameter {Array.<ParticleConstraint>} constraints                           -
 * @parameter {Array.<Tr2ParticleElementDeclaration>} elements                   -
 * @parameter {ParticleEmitter|ParticleEmitterGPU} emitParticleDuringLifeEmitter -
 * @parameter {ParticleEmitter|ParticleEmitterGPU} emitParticleOnDeathEmitter    -
 * @parameter {Array.<ParticleForce>} forces                                     -
 * @parameter {Number} maxParticleCount                                          -
 * @parameter {Boolean} requiresSorting                                          -
 * @parameter {Boolean} updateBoundingBox                                        -
 * @parameter {Boolean} updateSimulation                                         -
 * @parameter {Boolean} useSimTimeRebase                                         -
 */
export default class Tr2ParticleSystem extends Tw2BaseClass
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

Tw2BaseClass.define(Tr2ParticleSystem, Type =>
{
    return {
        isStaging: true,
        type: "Tr2ParticleSystem",
        category: "ParticleSystem",
        props: {
            applyAging: Type.BOOLEAN,
            applyForce: Type.BOOLEAN,
            constraints: [["Tr2PlaneConstraint"]],
            elements: [["Tr2ParticleElementDeclaration"]],
            emitParticleDuringLifeEmitter: ["Tr2DynamicEmitter", "Tr2GpuUniqueEmitter"],
            emitParticleOnDeathEmitter: ["Tr2DynamicEmitter", "Tr2GpuUniqueEmitter"],
            forces: Type.ARRAY,
            maxParticleCount: Type.NUMBER,
            requiresSorting: Type.BOOLEAN,
            updateBoundingBox: Type.BOOLEAN,
            updateSimulation: Type.BOOLEAN,
            useSimTimeRebase: Type.BOOLEAN
        }
    };
});

