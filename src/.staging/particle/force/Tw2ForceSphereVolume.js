import {Tw2StagingClass} from "../../class";

/**
 * Tw2ForceSphereVolume
 * @ccp Tr2ForceSphereVolume
 * @implements ParticleForce
 *
 * @parameter {Array.<ParticleForce>} forces -
 * @parameter {Number} radius                -
 */
export default class Tw2ForceSphereVolume extends Tw2StagingClass
{

    forces = [];
    radius = 0;

}

Tw2StagingClass.define(Tw2ForceSphereVolume, Type =>
{
    return {
        type: "Tw2ForceSphereVolume",
        category: "ParticleForce",
        props: {
            forces: [["Tw2ParticleAttractorForce", "Tw2ParticleTurbulenceForce"]],
            radius: Type.NUMBER
        }
    };
});

