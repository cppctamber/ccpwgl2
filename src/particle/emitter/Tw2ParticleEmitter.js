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
        //throw new ErrAbstractClassMethod();
    }

    /**
     * Gets object resources
     * @param {Array} [out=[]] - Optional receiving array
     * @returns {Array.<Tw2Resource>} [out]
     */
    GetResources(out = [])
    {
        if (this.particleSystem) this.particleSystem.GetResources(out);
        return out;
    }

    /**
     * Per frame update
     * @param {number} dt - delta time
     */
    Update(dt)
    {
        //throw new ErrAbstractClassMethod();
    }

}