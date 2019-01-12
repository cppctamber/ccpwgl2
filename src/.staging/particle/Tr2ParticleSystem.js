import {Tw2BaseClass} from "../../global";

/**
 * Tr2ParticleSystem
 * @implements ParticleSystem
 *
 * @property {Boolean} applyAging                                               -
 * @property {Boolean} applyForce                                               -
 * @property {Array.<ParticleConstraint>} constraints                           -
 * @property {Array.<Tr2ParticleElementDeclaration>} elements                   -
 * @property {ParticleEmitter|ParticleEmitterGPU} emitParticleDuringLifeEmitter -
 * @property {ParticleEmitter|ParticleEmitterGPU} emitParticleOnDeathEmitter    -
 * @property {Array.<ParticleForce>} forces                                     -
 * @property {Number} maxParticleCount                                          -
 * @property {Boolean} requiresSorting                                          -
 * @property {Boolean} updateBoundingBox                                        -
 * @property {Boolean} updateSimulation                                         -
 * @property {Boolean} useSimTimeRebase                                         -
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

