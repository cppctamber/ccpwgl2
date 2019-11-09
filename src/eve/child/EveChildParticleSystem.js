import { mat4, quat, vec3 } from "global";
import { Tw2PerObjectData } from "core";
import { EveChild } from "./EveChild";


/**
 * Particle system attachment to space object
 * TODO: Implement "lodSphereRadius"
 * TODO: Implement "minScreenSize"
 * TODO: Implement "useDynamicLod"
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
export class EveChildParticleSystem extends EveChild
{
    // ccp
    name = "";
    display = true;
    localTransform = mat4.create();
    lodSphereRadius = 0;
    mesh = null;
    minScreenSize = 0;
    particleEmitters = [];
    particleSystems = [];
    rotation = quat.create();
    scaling = vec3.fromValues(1, 1, 1);
    translation = vec3.create();
    useDynamicLod = false;

    // ccpwgl
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

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            [ "display", r.boolean ],
            [ "localTransform", r.matrix ],
            [ "lodSphereRadius", r.float ],
            [ "mesh", r.object ],
            [ "minScreenSize", r.float ],
            [ "name", r.string ],
            [ "particleEmitters", r.array ],
            [ "particleSystems", r.array ],
            [ "rotation", r.vector4 ],
            [ "scaling", r.vector3 ],
            [ "translation", r.vector3 ],
            [ "useDynamicLod", r.boolean ]
        ];
    }

    /**
     * Identifies that the class is in staging
     * @property {null|Number}
     */
    static __isStaging = 1;

}
