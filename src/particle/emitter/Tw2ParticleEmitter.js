/* eslint no-unused-vars:0 */
import {Tw2BaseClass} from "../../global";
import {ErrAbstractClassMethod} from "../../core";

/**
 * Particle Emitter base class
 * @ccp N/A
 *
 * @property {Tw2ParticleSystem} particleSystem
 */
export class Tw2ParticleEmitter extends Tw2BaseClass
{

    particleSystem = null;


    /**
     * Initializes the particle emitter
     */
    Initialize()
    {
        throw new ErrAbstractClassMethod();
    }

    /**
     * Per frame update
     * @param {number} dt - delta time
     */
    Update(dt)
    {
        throw new ErrAbstractClassMethod();
    }

}

Tw2BaseClass.define(Tw2ParticleEmitter, Type =>
{
    return {
        type: "Tw2ParticleEmitter",
        category: "ParticleEmitter",
        isAbstract: true,
        props: {
            particleSystem: ["Tw2GpuParticleSystem", "Tw2ParticleSystem"]
        }
    };
});