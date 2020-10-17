import { Tw2ParticleForce } from "particle/force/Tw2ParticleForce";
import { meta } from "utils";

/**
 * EveParticleDragForce
 * Todo: Is this just a copy of Tw2ParticleDragForce?
 *
 * @property {Number} drag -
 */
export class EveParticleDragForce extends Tw2ParticleForce
{

    @meta.float
    drag = 0;

    /**
     * Identifies that the class is in staging
     * @property {null|Number}
     */
    static __isStaging = 4;

}
