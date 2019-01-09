import {vec3} from "../../../global";
import {Tw2BaseClass} from "../../class";

/**
 * EveShip2
 * @implements EveObject
 *
 * @parameter {Array.<EveObjectSet>} attachments    -
 * @parameter {EveBoosterSet2} boosters             -
 * @parameter {vec3} boundingSphereCenter           -
 * @parameter {Number} boundingSphereRadius         -
 * @parameter {Array.<EveObject>} children          -
 * @parameter {Array.<EveCustomMask>} customMasks   -
 * @parameter {Array.<EveObjectItem>} decals        -
 * @parameter {String} dna                          -
 * @parameter {Array.<EveObjectSet>} locatorSets    -
 * @parameter {Array.<EveObjectItem>} locators      -
 * @parameter {Mesh|Tr2MeshLod} mesh                -
 * @parameter {Curve|CurveAdapter} rotationCurve    -
 * @parameter {Tr2Effect} shadowEffect              -
 * @parameter {vec3} shapeEllipsoidCenter           -
 * @parameter {vec3} shapeEllipsoidRadius           -
 * @parameter {Curve|CurveAdapter} translationCurve -
 */
export default class EveShip2 extends Tw2BaseClass
{

    attachments = [];
    boosters = null;
    boundingSphereCenter = vec3.create();
    boundingSphereRadius = 0;
    children = [];
    customMasks = [];
    decals = [];
    dna = "";
    locatorSets = [];
    locators = [];
    mesh = null;
    rotationCurve = null;
    shadowEffect = null;
    shapeEllipsoidCenter = vec3.create();
    shapeEllipsoidRadius = vec3.create();
    translationCurve = null;

}

Tw2BaseClass.define(EveShip2, Type =>
{
    return {
        isStaging: true,
        type: "EveShip2",
        category: "EveObject",
        props: {
            attachments: [["EveSpotlightSet", "EveSpriteSet"]],
            boosters: ["EveBoosterSet2"],
            boundingSphereCenter: Type.VECTOR3,
            boundingSphereRadius: Type.NUMBER,
            children: [["EveTransform"]],
            customMasks: [["EveCustomMask"]],
            decals: [["EveSpaceObjectDecal"]],
            dna: Type.STRING,
            locatorSets: [["EveLocatorSets"]],
            locators: [["EveLocator2"]],
            mesh: ["Tr2Mesh", "Tr2MeshLod"],
            rotationCurve: ["Tr2CurveConstant", "Tr2RotationAdapter"],
            shadowEffect: ["Tr2Effect"],
            shapeEllipsoidCenter: Type.VECTOR3,
            shapeEllipsoidRadius: Type.VECTOR3,
            translationCurve: ["Tr2CurveConstant", "Tr2TranslationAdapter"]
        }
    };
});

