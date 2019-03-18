import {mat4, quat, vec3} from "../../global";
import {Tw2PerObjectData} from "../../core";
import {EveChild} from "./EveChild";


/**
 * Particle system attachment to space object
 * TODO: Implement "lodSphereRadius"
 * TODO: Implement "minScreenSize"
 * TODO: Implement "useDynamicLod"
 * @ccp EveChildParticleSystem
 *
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

EveChild.define(EveChildParticleSystem, Type =>
{
    return {
        type: "EveChildParticleSystem",
        props: {
            display: Type.BOOLEAN,
            localTransform: Type.TR_LOCAL,
            lodSphereRadius: Type.NUMBER,
            mesh: ["Tr2InstancedMesh"],
            minScreenSize: Type.NUMBER,
            particleEmitters: [["Tr2DynamicEmitter", "Tr2GpuSharedEmitter", "Tr2GpuUniqueEmitter", "Tr2StaticEmitter"]],
            particleSystems: [["Tr2ParticleSystem", "Tr2GpuParticleSystem"]],
            rotation: Type.TR_ROTATION,
            scaling: Type.TR_SCALING,
            translation: Type.TR_TRANSLATION,
            useDynamicLod: Type.BOOLEAN
        },
        notImplemented: [
            "lodSphereRadius",
            "minScreenSize",
            "useDynamicLod"
        ]
    };
});
