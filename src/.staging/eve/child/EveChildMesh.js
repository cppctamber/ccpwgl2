import {mat4, quat, vec3} from "../../../global";
import {Tw2StagingClass} from "../../class";

/**
 * EveChildMesh
 * @implements ObjectChild
 *
 * @parameter {Boolean} display                          -
 * @parameter {mat4} localTransform                      -
 * @parameter {Number} lowestLodVisible                  -
 * @parameter {Mesh} mesh                                -
 * @parameter {Number} minScreenSize                     -
 * @parameter {quat} rotation                            -
 * @parameter {vec3} scaling                             -
 * @parameter {Number} sortValueOffset                   -
 * @parameter {Boolean} staticTransform                  -
 * @parameter {Array.<ChildModifier>} transformModifiers -
 * @parameter {vec3} translation                         -
 * @parameter {Boolean} useSRT                           -
 * @parameter {Boolean} useSpaceObjectData               -
 */
export default class EveChildMesh extends Tw2StagingClass
{

    display = false;
    localTransform = mat4.create();
    lowestLodVisible = 0;
    mesh = null;
    minScreenSize = 0;
    rotation = quat.create();
    scaling = vec3.fromValues(1, 1, 1);
    sortValueOffset = 0;
    staticTransform = false;
    transformModifiers = [];
    translation = vec3.create();
    useSRT = false;
    useSpaceObjectData = false;

}

Tw2StagingClass.define(EveChildMesh, Type =>
{
    return {
        type: "EveChildMesh",
        category: "ObjectChild",
        props: {
            display: Type.BOOLEAN,
            localTransform: Type.TR_LOCAL,
            lowestLodVisible: Type.NUMBER,
            mesh: ["Tw2InstancedMesh", "Tw2Mesh"],
            minScreenSize: Type.NUMBER,
            rotation: Type.TR_ROTATION,
            scaling: Type.TR_SCALING,
            sortValueOffset: Type.NUMBER,
            staticTransform: Type.BOOLEAN,
            transformModifiers: [["EveChildModifierBillboard2D", "EveChildModifierBillboard3D", "EveChildModifierCameraOrientedRotationConstrained", "EveChildModifierSRT", "EveChildModifierTranslateWithCamera"]],
            translation: Type.TR_TRANSLATION,
            useSRT: Type.BOOLEAN,
            useSpaceObjectData: Type.BOOLEAN
        }
    };
});

