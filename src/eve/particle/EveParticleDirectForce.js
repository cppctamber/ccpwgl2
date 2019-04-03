import {vec3} from "../../global";
import {Tw2ParticleForce} from "../../particle/force/Tw2ParticleForce";

/**
 * EveParticleDirectForce
 * Todo: Is this just a copy of Tw2ParticleDirectForce?
 *
 * @property {vec3} force -
 */
export class EveParticleDirectForce extends Tw2ParticleForce
{

    force = vec3.create();

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            ["force", r.vector3]
        ];
    }

    /**
     * Identifies that the class is in staging
     * @property {null|Number}
     */
    static __isStaging = 4;

}