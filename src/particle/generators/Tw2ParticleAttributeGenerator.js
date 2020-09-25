/* eslint no-unused-vars:0 */
import { meta, vec3, Tw2BaseClass } from "global";


export class Tw2ParticleAttributeGenerator extends Tw2BaseClass
{

    /**
     * Binds a particle system element to the generator
     * @param {Tw2ParticleSystem} ps
     * @returns {Boolean} True if successfully bound
     */
    @meta.abstract
    Bind(ps)
    {

    }

    /**
     * Generates the attributes
     * @param {Tw2ParticleElement} position
     * @param {Tw2ParticleElement} velocity
     * @param {number} index
     */
    @meta.abstract
    Generate(position, velocity, index)
    {

    }

    /**
     * Global and scratch variables
     * @type {*}
     */
    static global = {
        vec3_0: vec3.create()
    };

}
