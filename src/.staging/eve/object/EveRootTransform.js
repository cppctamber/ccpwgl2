import {quat, vec3} from "../../../global";
import {Tw2StagingClass} from "../../class";

/**
 * EveRootTransform
 *
 * @parameter {Number} boundingSphereRadius       -
 * @parameter {Array.<EveObject>} children        -
 * @parameter {Array.<Tw2CurveSet>} curveSets     -
 * @parameter {Boolean} display                   -
 * @parameter {Tw2Mesh} mesh                      -
 * @parameter {Number} modifier                   -
 * @parameter {Array} observers                   -
 * @parameter {quat} rotation                     -
 * @parameter {Tw2CurveConstant} rotationCurve    -
 * @parameter {vec3} scaling                      -
 * @parameter {Number} sortValueMultiplier        -
 * @parameter {vec3} translation                  -
 * @parameter {Tw2CurveConstant} translationCurve -
 */
export default class EveRootTransform extends Tw2StagingClass
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

Tw2StagingClass.define(EveRootTransform, Type =>
{
    return {
        type: "EveRootTransform",
        props: {
            boundingSphereRadius: Type.NUMBER,
            children: [["EveTransform"]],
            curveSets: [["Tw2CurveSet"]],
            display: Type.BOOLEAN,
            mesh: ["Tw2Mesh"],
            modifier: Type.NUMBER,
            observers: Type.ARRAY,
            rotation: Type.TR_ROTATION,
            rotationCurve: ["Tw2CurveConstant"],
            scaling: Type.TR_SCALING,
            sortValueMultiplier: Type.NUMBER,
            translation: Type.TR_TRANSLATION,
            translationCurve: ["Tw2CurveConstant"]
        }
    };
});

