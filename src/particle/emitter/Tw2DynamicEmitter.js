import { meta } from "utils";
import { Tw2ParticleEmitter } from "./Tw2ParticleEmitter";


@meta.type("Tw2DynamicEmitter", "Tr2DynamicEmitter")
@meta.define({
    wgl: "Tw2DynamicEmitter",
    ccp: "Tr2DynamicEmitter"
})
export class Tw2DynamicEmitter extends Tw2ParticleEmitter
{

    @meta.string
    name = "";

    @meta.list("Tw2ParticleAttributeGenerator")
    generators = [];

    /**
     * A lifetime budget for this emitter: it stops emitting once it has spawned
     * this many particles. **Negative means unlimited**, and that is the default.
     *
     * Carbon clamps the whole batch before inserting any of it
     * (`Tr2DynamicEmitter.cpp:172-179`), counting against a running total that
     * `Rebind` resets. ccpwgl declared the field, never read it, and defaulted
     * it to 0 - so switching it on without also changing the default to -1 would
     * have made every dynamic emitter in the engine stop emitting entirely.
     */
    @meta.float
    maxParticles = -1;

    @meta.struct("Tw2ParticleSystem")
    particleSystem = null;

    @meta.float
    rate = 0;


    _accumulatedRate = 0;

    // Lifetime spawn total, checked against maxParticles. Carbon resets it on
    // rebind (Tr2DynamicEmitter.cpp:231), so a re-bound emitter starts its
    // budget again rather than staying exhausted.
    _emittedParticles = 0;

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
        this._emittedParticles = 0;
        this._accumulatedRate = 0;
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
        let count = Math.floor(this._accumulatedRate);
        this._accumulatedRate -= count;

        // Carbon counts the whole batch against the budget before inserting any
        // of it (Tr2DynamicEmitter.cpp:175-179), rather than refusing per
        // particle. Negative is unlimited.
        if (this.maxParticles >= 0 && this._emittedParticles + count > this.maxParticles)
        {
            count = Math.max(this.maxParticles - this._emittedParticles, 0);
        }
        this._emittedParticles += count;

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
