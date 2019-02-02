import {vec3} from "../global/index";
import {Tw2BaseClass} from "../global/index";

/**
 * EveShip2
 * @implements EveObject
 *
 * @property {Array.<EveObjectSet>} attachments    -
 * @property {EveBoosterSet2} boosters             -
 * @property {vec3} boundingSphereCenter           -
 * @property {Number} boundingSphereRadius         -
 * @property {Array.<EveObject>} children          -
 * @property {Array.<EveCustomMask>} customMasks   -
 * @property {Array.<EveObjectItem>} decals        -
 * @property {String} dna                          -
 * @property {Array.<EveObjectSet>} locatorSets    -
 * @property {Array.<EveObjectItem>} locators      -
 * @property {Mesh|Tr2MeshLod} mesh                -
 * @property {Curve|CurveAdapter} rotationCurve    -
 * @property {Tr2Effect} shadowEffect              -
 * @property {vec3} shapeEllipsoidCenter           -
 * @property {vec3} shapeEllipsoidRadius           -
 * @property {Curve|CurveAdapter} translationCurve -
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

