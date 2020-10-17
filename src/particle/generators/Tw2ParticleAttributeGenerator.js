/* eslint no-unused-vars:0 */
import { meta } from "utils";
import { vec3 } from "math";


export class Tw2ParticleAttributeGenerator extends meta.Model
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
