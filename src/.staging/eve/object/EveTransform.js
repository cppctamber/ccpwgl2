import {quat, vec3} from "../../../global";
import {Tw2BaseClass} from "../../class";

/**
 * EveTransform
 * @implements EveObject
 *
 * @parameter {Array.<EveObject>} children                                  -
 * @parameter {Array.<TriCurveSet>} curveSets                               -
 * @parameter {Boolean} display                                             -
 * @parameter {Number} distanceBasedScaleArg1                               -
 * @parameter {Number} distanceBasedScaleArg2                               -
 * @parameter {Boolean} hideOnLowQuality                                    -
 * @parameter {Mesh|Tr2MeshLod} mesh                                        -
 * @parameter {Number} modifier                                             -
 * @parameter {Array.<TriObserverLocal>} observers                          -
 * @parameter {vec3} overrideBoundsMax                                      -
 * @parameter {vec3} overrideBoundsMin                                      -
 * @parameter {Array.<ParticleEmitter|ParticleEmitterGPU>} particleEmitters -
 * @parameter {Array.<ParticleSystem>} particleSystems                      -
 * @parameter {quat} rotation                                               -
 * @parameter {vec3} scaling                                                -
 * @parameter {Number} sortValueMultiplier                                  -
 * @parameter {vec3} translation                                            -
 * @parameter {Boolean} update                                              -
 * @parameter {Boolean} useDistanceBasedScale                               -
 * @parameter {Boolean} useLodLevel                                         -
 * @parameter {Number} visibilityThreshold                                  -
 */
export default class EveTransform extends Tw2BaseClass
{

    children = [];
    curveSets = [];
    display = false;
    distanceBasedScaleArg1 = 0;
    distanceBasedScaleArg2 = 0;
    hideOnLowQuality = false;
    mesh = null;
    modifier = 0;
    observers = [];
    overrideBoundsMax = vec3.create();
    overrideBoundsMin = vec3.create();
    particleEmitters = [];
    particleSystems = [];
    rotation = quat.create();
    scaling = vec3.fromValues(1, 1, 1);
    sortValueMultiplier = 0;
    translation = vec3.create();
    update = false;
    useDistanceBasedScale = false;
    useLodLevel = false;
    visibilityThreshold = 0;

}

Tw2BaseClass.define(EveTransform, Type =>
{
    return {
        isStaging: true,
        type: "EveTransform",
        category: "EveObject",
        props: {
            children: [["EveSpherePin", "EveTransform"]],
            curveSets: [["TriCurveSet"]],
            display: Type.BOOLEAN,
            distanceBasedScaleArg1: Type.NUMBER,
            distanceBasedScaleArg2: Type.NUMBER,
            hideOnLowQuality: Type.BOOLEAN,
            mesh: ["Tr2InstancedMesh", "Tr2Mesh", "Tr2MeshLod"],
            modifier: Type.NUMBER,
            observers: [["TriObserverLocal"]],
            overrideBoundsMax: Type.VECTOR3,
            overrideBoundsMin: Type.VECTOR3,
            particleEmitters: [["Tr2DynamicEmitter", "Tr2GpuUniqueEmitter", "Tr2StaticEmitter"]],
            particleSystems: [["Tr2ParticleSystem"]],
            rotation: Type.TR_ROTATION,
            scaling: Type.TR_SCALING,
            sortValueMultiplier: Type.NUMBER,
            translation: Type.TR_TRANSLATION,
            update: Type.BOOLEAN,
            useDistanceBasedScale: Type.BOOLEAN,
            useLodLevel: Type.BOOLEAN,
            visibilityThreshold: Type.NUMBER
        }
    };
});

