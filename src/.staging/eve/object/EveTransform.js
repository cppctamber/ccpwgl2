import {quat, vec3} from "../../../global";
import {Tw2BaseClass} from "../../../global";

/**
 * EveTransform
 * @implements EveObject
 *
 * @property {Array.<EveObject>} children                                  -
 * @property {Array.<TriCurveSet>} curveSets                               -
 * @property {Boolean} display                                             -
 * @property {Number} distanceBasedScaleArg1                               -
 * @property {Number} distanceBasedScaleArg2                               -
 * @property {Boolean} hideOnLowQuality                                    -
 * @property {Mesh|Tr2MeshLod} mesh                                        -
 * @property {Number} modifier                                             -
 * @property {Array.<TriObserverLocal>} observers                          -
 * @property {vec3} overrideBoundsMax                                      -
 * @property {vec3} overrideBoundsMin                                      -
 * @property {Array.<ParticleEmitter|ParticleEmitterGPU>} particleEmitters -
 * @property {Array.<ParticleSystem>} particleSystems                      -
 * @property {quat} rotation                                               -
 * @property {vec3} scaling                                                -
 * @property {Number} sortValueMultiplier                                  -
 * @property {vec3} translation                                            -
 * @property {Boolean} update                                              -
 * @property {Boolean} useDistanceBasedScale                               -
 * @property {Boolean} useLodLevel                                         -
 * @property {Number} visibilityThreshold                                  -
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

