/* eslint no-unused-vars:0 */
import {util} from "../../global";

/**
 * Tw2ParticleConstraint base class
 * - Not implemented yet
 *
 * @property {String|number} _id
 * @property {String} name
 */
export class Tw2ParticleConstraint
{

    _id = util.generateID();
    name = "";


    /**
     * Applies constraints
     * @param {Array} buffers
     * @param {Array} instanceStride
     * @param {number} aliveCount
     * @param {number} dt
     */
    ApplyConstraint(buffers, instanceStride, aliveCount, dt)
    {

    }

}