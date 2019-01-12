import {Tw2BaseClass} from "../../../global";

/**
 * Tr2ForceSphereVolume
 * @implements ParticleForce
 *
 * @property {Array.<ParticleForce>} forces -
 * @property {Number} radius                -
 */
export default class Tr2ForceSphereVolume extends Tw2BaseClass
{

    forces = [];
    radius = 0;

}

Tw2BaseClass.define(Tr2ForceSphereVolume, Type =>
{
    return {
        isStaging: true,
        type: "Tr2ForceSphereVolume",
        category: "ParticleForce",
        props: {
            forces: [["Tr2ParticleAttractorForce", "Tr2ParticleTurbulenceForce"]],
            radius: Type.NUMBER
        }
    };
});

