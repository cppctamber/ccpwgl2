import {mat4} from "../../global";
import {Tw2PerObjectData} from "../../core";
import {EveChild} from "./EveChild";

/**
 * Particle system attachment to space object
 * TODO: Implement LOD
 *
 * @property {Tw2Mesh} mesh
 * @property {Array<Tw2ParticleEmitter>} particleEmitters
 * @property {Array<Tw2ParticleSystem>} particleSystems
 * @property {Tw2PerObjectData} _perObjectData
 * @class
 */
export class EveChildParticleSystem extends EveChild
{

    mesh = null;
    particleEmitters = [];
    particleSystems = [];
    _perObjectData = Tw2PerObjectData.from(EveChild.perObjectData);


    /**
     * Gets the child's resources
     * @param {Array} [out=[]]
     * @returns {Array.<Tw2Resource>} out
     */
    GetResources(out)
    {
        if (this.mesh) this.mesh.GetResources(out);
        return out;
    }

    /**
     * Per frame update
     * @param {number} dt
     * @param {mat4} parentTransform
     * @param {Number} [parentLod]
     */
    Update(dt, parentTransform, parentLod)
    {
        super.Update(dt, parentTransform, parentLod);

        for (let i = 0; i < this.particleEmitters.length; ++i)
        {
            this.particleEmitters[i].Update(dt);
        }

        for (let i = 0; i < this.particleSystems.length; ++i)
        {
            this.particleSystems[i].Update(dt);
        }
    }

    /**
     * Gets render batches
     * @param {number} mode
     * @param {Tw2BatchAccumulator} accumulator
     */
    GetBatches(mode, accumulator)
    {
        if (this.display && this.mesh && this.lod >= this.lowestLodVisible)
        {
            mat4.transpose(this._perObjectData.ffe.Get("world"), this.worldTransform);
            mat4.invert(this._perObjectData.ffe.Get("worldInverseTranspose"), this.worldTransform);
            this.mesh.GetBatches(mode, accumulator, this._perObjectData);
        }
    }

}