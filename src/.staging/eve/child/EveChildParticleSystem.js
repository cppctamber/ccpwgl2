import {mat4, quat, vec3} from "../../../global";
import {Tw2StagingClass} from "../../class";

/**
 * EveChildParticleSystem
 * @implements ObjectChild
 *
 * @parameter {Boolean} display                                             -
 * @parameter {mat4} localTransform                                         -
 * @parameter {Number} lodSphereRadius                                      -
 * @parameter {Tw2InstancedMesh} mesh                                       -
 * @parameter {Number} minScreenSize                                        -
 * @parameter {Array.<ParticleEmitter|ParticleEmitterGPU>} particleEmitters -
 * @parameter {Array.<ParticleSystem>} particleSystems                      -
 * @parameter {quat} rotation                                               -
 * @parameter {vec3} scaling                                                -
 * @parameter {vec3} translation                                            -
 * @parameter {Boolean} useDynamicLod                                       -
 */
export default class EveChildParticleSystem extends Tw2StagingClass
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

Tw2StagingClass.define(EveChildParticleSystem, Type =>
{
    return {
        type: "EveChildParticleSystem",
        category: "ObjectChild",
        props: {
            display: Type.BOOLEAN,
            localTransform: Type.TR_LOCAL,
            lodSphereRadius: Type.NUMBER,
            mesh: ["Tw2InstancedMesh"],
            minScreenSize: Type.NUMBER,
            particleEmitters: [["Tw2DynamicEmitter", "Tw2GpuSharedEmitter", "Tw2GpuUniqueEmitter", "Tw2StaticEmitter"]],
            particleSystems: [["Tw2ParticleSystem"]],
            rotation: Type.TR_ROTATION,
            scaling: Type.TR_SCALING,
            translation: Type.TR_TRANSLATION,
            useDynamicLod: Type.BOOLEAN
        }
    };
});

