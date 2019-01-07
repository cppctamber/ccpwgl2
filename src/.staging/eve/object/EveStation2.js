import {vec3} from "../../../global";
import {Tw2StagingClass} from "../../class";

/**
 * EveStation2
 *
 * @parameter {Array.<EveObjectSet>} attachments       -
 * @parameter {vec3} boundingSphereCenter              -
 * @parameter {Number} boundingSphereRadius            -
 * @parameter {Array.<EveObject>} children             -
 * @parameter {Array.<Tw2CurveSet>} curveSets          -
 * @parameter {Array.<EveObjectItem>} decals           -
 * @parameter {Array.<ObjectChild>} effectChildren     -
 * @parameter {Array.<Tw2PointLight>} lights           -
 * @parameter {Array.<EveObjectSet>} locatorSets       -
 * @parameter {Array.<EveObjectItem>} locators         -
 * @parameter {Tw2Mesh} mesh                           -
 * @parameter {Tw2MeshLod} meshLod                     -
 * @parameter {Tw2RotationAdapter} modelRotationCurve  -
 * @parameter {Number} modelScale                      -
 * @parameter {Array.<Tw2ObserverLocal>} observers     -
 * @parameter {Tw2RotationAdapter} rotationCurve       -
 * @parameter {Tw2Effect} shadowEffect                 -
 * @parameter {Tw2TranslationAdapter} translationCurve -
 */
export default class EveStation2 extends Tw2StagingClass
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

Tw2StagingClass.define(EveStation2, Type =>
{
    return {
        type: "EveStation2",
        props: {
            attachments: [["EvePlaneSet", "EveSpotlightSet", "EveSpriteSet"]],
            boundingSphereCenter: Type.VECTOR3,
            boundingSphereRadius: Type.NUMBER,
            children: [["EveTransform"]],
            curveSets: [["Tw2CurveSet"]],
            decals: [["EveSpaceObjectDecal"]],
            effectChildren: [["EveChildContainer", "EveChildMesh"]],
            lights: [["Tw2PointLight"]],
            locatorSets: [["EveLocatorSets"]],
            locators: [["EveLocator2"]],
            mesh: ["Tw2Mesh"],
            meshLod: ["Tw2MeshLod"],
            modelRotationCurve: ["Tw2RotationAdapter"],
            modelScale: Type.NUMBER,
            observers: [["Tw2ObserverLocal"]],
            rotationCurve: ["Tw2RotationAdapter"],
            shadowEffect: ["Tw2Effect"],
            translationCurve: ["Tw2TranslationAdapter"]
        }
    };
});

