import { meta } from "utils";
import { vec3 } from "math";
import { Tw2ParticleForce } from "particle/force/Tw2ParticleForce";

/**
 * EveParticleDirectForce
 * Todo: Is this just a copy of Tw2ParticleDirectForce?
 *
 * @property {vec3} force -
 */
export class EveParticleDirectForce extends Tw2ParticleForce
{

    @meta.vector3
    force = vec3.create();

    /**
     * Identifies that the class is in staging
     * @property {null|Number}
     */
    static __isStaging = 4;

}
