/* eslint no-unused-vars:0 */
import { meta, Tw2BaseClass } from "global";


export class Tw2ParticleConstraint extends Tw2BaseClass
{

    /**
     * Applies constraints
     * @param {Array} buffers
     * @param {Array} instanceStride
     * @param {number} aliveCount
     * @param {number} dt
     */
    @meta.abstract
    ApplyConstraint(buffers, instanceStride, aliveCount, dt)
    {

    }

}
