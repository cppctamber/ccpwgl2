import {quat, vec3, vec4} from "../../../global";
import {Tw2StagingClass} from "../../class";

/**
 * EveCustomMask
 *
 * @parameter {Number} materialIndex -
 * @parameter {vec3} position        -
 * @parameter {quat} rotation        -
 * @parameter {vec3} scaling         -
 * @parameter {vec4} targetMaterials -
 */
export default class EveCustomMask extends Tw2StagingClass
{

    materialIndex = 0;
    position = vec3.create();
    rotation = quat.create();
    scaling = vec3.fromValues(1, 1, 1);
    targetMaterials = vec4.create();

}

Tw2StagingClass.define(EveCustomMask, Type =>
{
    return {
        type: "EveCustomMask",
        props: {
            materialIndex: Type.NUMBER,
            position: Type.TR_TRANSLATION,
            rotation: Type.TR_ROTATION,
            scaling: Type.TR_SCALING,
            targetMaterials: Type.VECTOR4
        }
    };
});

