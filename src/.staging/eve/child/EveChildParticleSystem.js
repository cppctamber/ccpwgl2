import {mat4, quat, vec3} from "../../../global";
import {Tw2BaseClass} from "../../class";

/**
 * EveChildParticleSystem
 * @implements ObjectChild
 *
 * @parameter {Boolean} display                                             -
 * @parameter {mat4} localTransform                                         -
 * @parameter {Number} lodSphereRadius                                      -
 * @parameter {Tr2InstancedMesh} mesh                                       -
 * @parameter {Number} minScreenSize                                        -
 * @parameter {Array.<ParticleEmitter|ParticleEmitterGPU>} particleEmitters -
 * @parameter {Array.<ParticleSystem>} particleSystems                      -
 * @parameter {quat} rotation                                               -
 * @parameter {vec3} scaling                                                -
 * @parameter {vec3} translation                                            -
 * @parameter {Boolean} useDynamicLod                                       -
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

