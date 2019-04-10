import {Tw2ParticleConstraint} from "./Tw2ParticleConstraint";
import {ErrAbstractClassMethod} from "../../core";

/**
 * Tr2PlaneConstraint
 * TODO: Implement
 * @ccp Tr2PlaneConstraint
 *
 * @property {Array.<ParticleAttributeGenerator>} generators -
 * @property {Number} reflectionNoise                        -
 */
export class Tr2PlaneConstraint extends Tw2ParticleConstraint
{

    generators = [];
    reflectionNoise = 0;

    /**
     * Applies constraints
     * @param {Array} buffers
     * @param {Array} instanceStride
     * @param {number} aliveCount
     * @param {number} dt
     */
    ApplyConstraint(buffers, instanceStride, aliveCount, dt)
    {
        //TODO Implement ApplyConstraint
    }

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            ["reflectionNoise", r.float],
            ["generators", r.array]
        ];
    }

    /**
     * Identifies that the class is in staging
     * @property {null|Number}
     */
    static __isStaging = 4;

}
