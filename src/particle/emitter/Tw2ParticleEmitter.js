/* eslint no-unused-vars:0 */
import { meta, Tw2BaseClass } from "global";


@meta.abstract
@meta.type("Tw2ParticleEmitter")
export class Tw2ParticleEmitter extends Tw2BaseClass
{

    @meta.objectOf("Tw2ParticleSystem")
    particleSystem = null;


    /**
     * Initializes the particle emitter
     */
    //@meta.abstract
    Initialize()
    {

    }

    /**
     * Gets object resources
     * @param {Array} [out=[]] - Optional receiving array
     * @returns {Array.<Tw2Resource>} [out]
     */
    GetResources(out = [])
    {
        if (this.particleSystem)
        {
            this.particleSystem.GetResources(out);
        }
        return out;
    }

    /**
     * Per frame update
     * @param {number} dt - delta time
     */
    //@meta.abstract
    Update(dt)
    {

    }

}
