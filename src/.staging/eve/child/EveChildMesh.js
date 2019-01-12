import {mat4, quat, vec3} from "../../../global";
import {Tw2BaseClass} from "../../../global";

/**
 * EveChildMesh
 * @implements ObjectChild
 *
 * @property {Boolean} display                          -
 * @property {mat4} localTransform                      -
 * @property {Number} lowestLodVisible                  -
 * @property {Mesh} mesh                                -
 * @property {Number} minScreenSize                     -
 * @property {quat} rotation                            -
 * @property {vec3} scaling                             -
 * @property {Number} sortValueOffset                   -
 * @property {Boolean} staticTransform                  -
 * @property {Array.<ChildModifier>} transformModifiers -
 * @property {vec3} translation                         -
 * @property {Boolean} useSRT                           -
 * @property {Boolean} useSpaceObjectData               -
 */
export default class EveChildMesh extends Tw2BaseClass
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

Tw2BaseClass.define(EveChildMesh, Type =>
{
    return {
        isStaging: true,
        type: "EveChildMesh",
        category: "ObjectChild",
        props: {
            display: Type.BOOLEAN,
            localTransform: Type.TR_LOCAL,
            lowestLodVisible: Type.NUMBER,
            mesh: ["Tr2InstancedMesh", "Tr2Mesh"],
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

