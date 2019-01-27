/* eslint no-unused-vars:0 */
import {util, Tw2BaseClass} from "../../global";
import {ErrAbstractClassMethod} from "../../core";

/**
 * Tw2ParticleConstraint base class
 * - Not implemented yet
 *
 * @property {String|number} _id
 * @property {String} name
 */
export class Tw2ParticleConstraint extends Tw2BaseClass
{

    /**
     * Applies constraints
     * @param {Array} buffers
     * @param {Array} instanceStride
     * @param {number} aliveCount
     * @param {number} dt
     */
    ApplyConstraint(buffers, instanceStride, aliveCount, dt)
    {
        throw new ErrAbstractClassMethod();
    }

}

Tw2BaseClass.define(Tw2ParticleConstraint, Type =>
{
    return {
        type: "Tw2ParticleConstraint",
        category: "ParticleConstraint",
        isAbstract: true
    };
});