import {quat, vec3} from "../global/index";
import {Tw2BaseClass} from "../global/index";

/**
 * EveRootTransform
 *
 * @property {Number} boundingSphereRadius       -
 * @property {Array.<EveObject>} children        -
 * @property {Array.<TriCurveSet>} curveSets     -
 * @property {Boolean} display                   -
 * @property {Tr2Mesh} mesh                      -
 * @property {Number} modifier                   -
 * @property {Array} observers                   -
 * @property {quat} rotation                     -
 * @property {Tr2CurveConstant} rotationCurve    -
 * @property {vec3} scaling                      -
 * @property {Number} sortValueMultiplier        -
 * @property {vec3} translation                  -
 * @property {Tr2CurveConstant} translationCurve -
 */
export default class EveRootTransform extends Tw2BaseClass
{

    boundingSphereRadius = 0;
    children = [];
    curveSets = [];
    display = false;
    mesh = null;
    modifier = 0;
    observers = [];
    rotation = quat.create();
    rotationCurve = null;
    scaling = vec3.fromValues(1, 1, 1);
    sortValueMultiplier = 0;
    translation = vec3.create();
    translationCurve = null;

}

Tw2BaseClass.define(EveRootTransform, Type =>
{
    return {
        isStaging: true,
        type: "EveRootTransform",
        props: {
            boundingSphereRadius: Type.NUMBER,
            children: [["EveTransform"]],
            curveSets: [["TriCurveSet"]],
            display: Type.BOOLEAN,
            mesh: ["Tr2Mesh"],
            modifier: Type.NUMBER,
            observers: Type.ARRAY,
            rotation: Type.TR_ROTATION,
            rotationCurve: ["Tr2CurveConstant"],
            scaling: Type.TR_SCALING,
            sortValueMultiplier: Type.NUMBER,
            translation: Type.TR_TRANSLATION,
            translationCurve: ["Tr2CurveConstant"]
        }
    };
});

