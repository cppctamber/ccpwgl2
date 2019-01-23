import {Tw2ParticleEmitter} from "./Tw2ParticleEmitter";

/**
 * Tw2DynamicEmitter
 * Todo: Implement "maxParticles"
 * @ccp Tr2DynamicEmitter
 *
 * @property {Array.<Tw2ParticleAttributeGenerator>} generators -
 * @property {Number} maxParticles                              -
 * @property {Tw2ParticleSystem} particleSystem                 -
 * @property {Number} rate                                      -
 * @property {number} _accumulatedRate                          -
 * @property {Boolean} _isValid                                 -
 */
export class Tw2DynamicEmitter extends Tw2ParticleEmitter
{
    // ccp
    generators = [];
    maxParticles = 0;
    particleSystem = null;
    rate = 0;
    
    // ccpwgl
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

Tw2ParticleEmitter.define(Tw2DynamicEmitter, Type =>
{
    return {
        type: "Tw2DynamicEmitter",
        category: "ParticleEmitter",
        props: {
            generators: [["Tr2RandomIntegerAttributeGenerator", "Tr2RandomUniformAttributeGenerator", "Tr2SphereShapeAttributeGenerator"]],
            maxParticles: Type.NUMBER,
            particleSystem: ["Tw2ParticleSystem"],
            rate: Type.NUMBER
        },
        notImplemented: [
            "maxParticles"
        ]
    };
});
