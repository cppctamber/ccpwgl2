import {mat4, quat, vec3} from "../../../global";
import {Tw2BaseClass} from "../../../global";

/**
 * EveChildParticleSystem
 * @implements ObjectChild
 *
 * @property {Boolean} display                                             -
 * @property {mat4} localTransform                                         -
 * @property {Number} lodSphereRadius                                      -
 * @property {Tr2InstancedMesh} mesh                                       -
 * @property {Number} minScreenSize                                        -
 * @property {Array.<ParticleEmitter|ParticleEmitterGPU>} particleEmitters -
 * @property {Array.<ParticleSystem>} particleSystems                      -
 * @property {quat} rotation                                               -
 * @property {vec3} scaling                                                -
 * @property {vec3} translation                                            -
 * @property {Boolean} useDynamicLod                                       -
 */
export default class EveChildParticleSystem extends Tw2BaseClass
{

    display = false;
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

}

Tw2BaseClass.define(EveChildParticleSystem, Type =>
{
    return {
        isStaging: true,
        type: "EveChildParticleSystem",
        category: "ObjectChild",
        props: {
            display: Type.BOOLEAN,
            localTransform: Type.TR_LOCAL,
            lodSphereRadius: Type.NUMBER,
            mesh: ["Tr2InstancedMesh"],
            minScreenSize: Type.NUMBER,
            particleEmitters: [["Tr2DynamicEmitter", "Tr2GpuSharedEmitter", "Tr2GpuUniqueEmitter", "Tr2StaticEmitter"]],
            particleSystems: [["Tr2ParticleSystem"]],
            rotation: Type.TR_ROTATION,
            scaling: Type.TR_SCALING,
            translation: Type.TR_TRANSLATION,
            useDynamicLod: Type.BOOLEAN
        }
    };
});

