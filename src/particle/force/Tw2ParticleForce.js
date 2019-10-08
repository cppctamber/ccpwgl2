/* eslint no-unused-vars:0 */
import { util, vec3, vec4, Tw2BaseClass } from "../../global";
import { ErrAbstractClassMethod } from "../../core";

/**
 * Tw2ParticleForce base class
 * @ccp N/A
 */
export class Tw2ParticleForce extends Tw2BaseClass
{

    /**
     * Applies forces
     * @param {Tw2ParticleElement} position - Position
     * @param {Tw2ParticleElement} velocity - Velocity
     * @param {Tw2ParticleElement} force    - force
     * @param {Number} [dt]                 - unused
     * @param {Number} [mass]               - unused
     */
    ApplyForce(position, velocity, force, dt, mass)
    {
        throw new ErrAbstractClassMethod();
    }

    /**
     * Per frame update (Called before ApplyForce)
     * @param {number} dt - delta time
     */
    Update(dt)
    {

    }

    /**
     * Global and scratch variables
     * @type {*}
     */
    static global = {
        vec3_0: vec3.create(),
        vec3_1: vec3.create(),
        vec4_0: vec4.create(),
    };

}
