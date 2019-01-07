/* eslint no-unused-vars:0 */
import {util, vec3} from "../../global";

/**
 * Tw2ParticleAttributeGenerator base class
 *
 * @property {number|String} id
 * @property {String} name
 * @class
 */
export class Tw2ParticleAttributeGenerator
{

    _id = util.generateID();
    name = "";


    /**
     * Binds a particle system element to the generator
     * @param {Tw2ParticleSystem} ps
     * @returns {Boolean} True if successfully bound
     */
    Bind(ps)
    {
        return false;
    }

    /**
     * Generates the attributes
     * @param {Tw2ParticleElement} position
     * @param {Tw2ParticleElement} velocity
     * @param {number} index
     */
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