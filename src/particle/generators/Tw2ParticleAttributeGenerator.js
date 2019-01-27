/* eslint no-unused-vars:0 */
import {util, vec3, Tw2BaseClass} from "../../global";
import {ErrAbstractClassMethod} from "../../core";

/**
 * Tw2ParticleAttributeGenerator base class
 *
 * @property {number|String} id
 * @property {String} name
 * @class
 */
export class Tw2ParticleAttributeGenerator extends Tw2BaseClass
{
    /**
     * Binds a particle system element to the generator
     * @param {Tw2ParticleSystem} ps
     * @returns {Boolean} True if successfully bound
     */
    Bind(ps)
    {
        throw new ErrAbstractClassMethod();
    }

    /**
     * Generates the attributes
     * @param {Tw2ParticleElement} position
     * @param {Tw2ParticleElement} velocity
     * @param {number} index
     */
    Generate(position, velocity, index)
    {
        throw new ErrAbstractClassMethod();
    }

    /**
     * Global and scratch variables
     * @type {*}
     */
    static global = {
        vec3_0: vec3.create()
    };

}

Tw2BaseClass.define(Tw2ParticleAttributeGenerator, Type =>
{
    return {
        type: "Tw2ParticleAttributeGenerator",
        category: "ParticleAttributeGenerator",
        isAbstract: true
    };
});