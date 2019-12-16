import { Tw2ParticleForce } from "particle/force/Tw2ParticleForce";

/**
 * EveParticleDragForce
 * Todo: Is this just a copy of Tw2ParticleDragForce?
 *
 * @property {Number} drag -
 */
export class EveParticleDragForce extends Tw2ParticleForce
{

    drag = 0;

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            [ "drag", r.float ]
        ];
    }

    /**
     * Identifies that the class is in staging
     * @property {null|Number}
     */
    static __isStaging = 4;

}
