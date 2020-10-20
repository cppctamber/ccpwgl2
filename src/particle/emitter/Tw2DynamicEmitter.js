import { meta } from "utils";
import { Tw2ParticleEmitter } from "./Tw2ParticleEmitter";


@meta.type("Tw2DynamicEmitter", "Tr2DynamicEmitter")
export class Tw2DynamicEmitter extends Tw2ParticleEmitter
{

    @meta.string
    name = "";

    @meta.list("Tw2ParticleAttributeGenerator")
    generators = [];

    @meta.notImplemented
    @meta.uint
    maxParticles = 0;

    @meta.struct("Tw2ParticleSystem")
    particleSystem = null;

    @meta.float
    rate = 0;


    _accumulatedRate = 0;
    _isValid = false;


    /**
     * Initializes the particle emitter
     */
    Initialize()
    {
        this.Rebind();
    }

    /**
     * Per frame update
     * @param {number} dt - delta time
     */
    Update(dt)
    {
        this.SpawnParticles(null, null, Math.min(dt, 0.1));
    }

    /**
     * Rebinds the emitter's generators to it's particle system
     */
    Rebind()
    {
        this._isValid = false;
        if (!this.particleSystem) return;

        for (let i = 0; i < this.generators.length; ++i)
        {
            if (!this.generators[i].Bind(this.particleSystem)) return;
        }

        this._isValid = true;
    }

    /**
     * Spawn particles
     * @param position
     * @param velocity
     * @param rateModifier
     */
    SpawnParticles(position, velocity, rateModifier)
    {
        if (!this._isValid) return;

        this._accumulatedRate += this.rate * rateModifier;
        const count = Math.floor(this._accumulatedRate);
        this._accumulatedRate -= count;

        for (let i = 0; i < count; ++i)
        {
            const index = this.particleSystem.BeginSpawnParticle();
            if (index === null) break;

            for (let j = 0; j < this.generators.length; ++j)
            {
                this.generators[j].Generate(position, velocity, index);
            }

            this.particleSystem.EndSpawnParticle();
        }
    }

}
