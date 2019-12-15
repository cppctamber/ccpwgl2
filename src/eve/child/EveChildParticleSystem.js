import { meta, mat4, quat, vec3 } from "global";
import { Tw2PerObjectData } from "core";
import { EveChild } from "./EveChild";


/**
 * Particle system attachment to space object
 *
 * @property {String} name                                                     -
 * @property {Boolean} display                                                 -
 * @property {mat4} localTransform                                             -
 * @property {Number} lodSphereRadius                                          -
 * @property {Tw2InstancedMesh} mesh                                           -
 * @property {Number} minScreenSize                                            -
 * @property {Array.<Tw2ParticleEmitter>} particleEmitters                     -
 * @property {Array.<Tw2ParticleSystem|Tr2GpuParticleSystem>} particleSystems  -
 * @property {quat} rotation                                                   -
 * @property {vec3} scaling                                                    -
 * @property {vec3} translation                                                -
 * @property {Boolean} useDynamicLod                                           -
 * @property {mat4} _worldTransform                                            -
 * @property {mat4} _worldTransformLast                                        -
 * @property {Tw2PerObjectData} _perObjectData                                 -
 */
@meta.type("EveChildParticleSystem", true)
@meta.stage(1)
export class EveChildParticleSystem extends EveChild
{

    @meta.black.string
    name = "";

    @meta.black.boolean
    display = true;

    @meta.black.matrix4
    localTransform = mat4.create();

    @meta.notImplemented
    @meta.black.float
    lodSphereRadius = 0;

    @meta.black.object
    mesh = null;

    @meta.notImplemented
    @meta.black.float
    minScreenSize = 0;

    @meta.black.list
    particleEmitters = [];

    @meta.black.list
    particleSystems = [];

    @meta.black.quaternion
    rotation = quat.create();

    @meta.black.vector3
    scaling = vec3.fromValues(1, 1, 1);

    @meta.black.vector3
    translation = vec3.create();

    @meta.notImplemented
    @meta.black.boolean
    useDynamicLod = false;

    @meta.boolean
    @meta.todo("Deprecated?")
    useSRT = true;


    _worldTransform = mat4.create();
    _worldTransformLast = mat4.create();
    _perObjectData = Tw2PerObjectData.from(EveChild.perObjectData);

    /**
     * Gets object resources
     * @param {Array} [out=[]] - Optional receiving array
     * @returns {Array.<Tw2Resource>} [out]
     */
    GetResources(out = [])
    {
        if (this.mesh) this.mesh.GetResources(out);

        for (let i = 0; i < this.particleEmitters.length; i++)
        {
            this.particleEmitters[i].GetResources(out);
        }

        for (let i = 0; i < this.particleSystems.length; i++)
        {
            this.particleSystems[i].GetResources(out);
        }

        return out;
    }


    /**
     * Per frame update
     * @param {number} dt
     * @param {mat4} parentTransform
     */
    Update(dt, parentTransform)
    {
        if (this.useSRT)
        {
            quat.normalize(this.rotation, this.rotation);
            mat4.fromRotationTranslationScale(this.localTransform, this.rotation, this.translation, this.scaling);
        }

        mat4.copy(this._worldTransformLast, this._worldTransform);
        mat4.multiply(this._worldTransform, parentTransform, this.localTransform);

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
        if (this.display && this.mesh)
        {
            mat4.transpose(this._perObjectData.ffe.Get("world"), this._worldTransform);
            mat4.invert(this._perObjectData.ffe.Get("worldInverseTranspose"), this._worldTransform);
            this.mesh.GetBatches(mode, accumulator, this._perObjectData);
        }
    }

}
