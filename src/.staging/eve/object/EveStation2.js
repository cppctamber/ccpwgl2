import {vec3} from "../../../global";
import {Tw2BaseClass} from "../../class";

/**
 * EveStation2
 *
 * @parameter {Array.<EveObjectSet>} attachments       -
 * @parameter {vec3} boundingSphereCenter              -
 * @parameter {Number} boundingSphereRadius            -
 * @parameter {Array.<EveObject>} children             -
 * @parameter {Array.<TriCurveSet>} curveSets          -
 * @parameter {Array.<EveObjectItem>} decals           -
 * @parameter {Array.<ObjectChild>} effectChildren     -
 * @parameter {Array.<Tr2PointLight>} lights           -
 * @parameter {Array.<EveObjectSet>} locatorSets       -
 * @parameter {Array.<EveObjectItem>} locators         -
 * @parameter {Tr2Mesh} mesh                           -
 * @parameter {Tr2MeshLod} meshLod                     -
 * @parameter {Tr2RotationAdapter} modelRotationCurve  -
 * @parameter {Number} modelScale                      -
 * @parameter {Array.<TriObserverLocal>} observers     -
 * @parameter {Tr2RotationAdapter} rotationCurve       -
 * @parameter {Tr2Effect} shadowEffect                 -
 * @parameter {Tr2TranslationAdapter} translationCurve -
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

