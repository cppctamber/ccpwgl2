import {vec3} from "../global/index";
import {Tw2BaseClass} from "../global/index";

/**
 * EveStation2
 *
 * @property {Array.<EveObjectSet>} attachments       -
 * @property {vec3} boundingSphereCenter              -
 * @property {Number} boundingSphereRadius            -
 * @property {Array.<EveObject>} children             -
 * @property {Array.<TriCurveSet>} curveSets          -
 * @property {Array.<EveObjectItem>} decals           -
 * @property {Array.<ObjectChild>} effectChildren     -
 * @property {Array.<Tr2PointLight>} lights           -
 * @property {Array.<EveObjectSet>} locatorSets       -
 * @property {Array.<EveObjectItem>} locators         -
 * @property {Tr2Mesh} mesh                           -
 * @property {Tr2MeshLod} meshLod                     -
 * @property {Tr2RotationAdapter} modelRotationCurve  -
 * @property {Number} modelScale                      -
 * @property {Array.<TriObserverLocal>} observers     -
 * @property {Tr2RotationAdapter} rotationCurve       -
 * @property {Tr2Effect} shadowEffect                 -
 * @property {Tr2TranslationAdapter} translationCurve -
 */
export default class EveStation2 extends Tw2BaseClass
{

    attachments = [];
    boundingSphereCenter = vec3.create();
    boundingSphereRadius = 0;
    children = [];
    curveSets = [];
    decals = [];
    effectChildren = [];
    lights = [];
    locatorSets = [];
    locators = [];
    mesh = null;
    meshLod = null;
    modelRotationCurve = null;
    modelScale = 0;
    observers = [];
    rotationCurve = null;
    shadowEffect = null;
    translationCurve = null;

}

Tw2BaseClass.define(EveStation2, Type =>
{
    return {
        isStaging: true,
        type: "EveStation2",
        props: {
            attachments: [["EvePlaneSet", "EveSpotlightSet", "EveSpriteSet"]],
            boundingSphereCenter: Type.VECTOR3,
            boundingSphereRadius: Type.NUMBER,
            children: [["EveTransform"]],
            curveSets: [["TriCurveSet"]],
            decals: [["EveSpaceObjectDecal"]],
            effectChildren: [["EveChildContainer", "EveChildMesh"]],
            lights: [["Tr2PointLight"]],
            locatorSets: [["EveLocatorSets"]],
            locators: [["EveLocator2"]],
            mesh: ["Tr2Mesh"],
            meshLod: ["Tr2MeshLod"],
            modelRotationCurve: ["Tr2RotationAdapter"],
            modelScale: Type.NUMBER,
            observers: [["TriObserverLocal"]],
            rotationCurve: ["Tr2RotationAdapter"],
            shadowEffect: ["Tr2Effect"],
            translationCurve: ["Tr2TranslationAdapter"]
        }
    };
});

