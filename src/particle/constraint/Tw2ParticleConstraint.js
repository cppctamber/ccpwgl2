/* eslint no-unused-vars:0 */
import { meta } from "utils";


export class Tw2ParticleConstraint extends meta.Model
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
