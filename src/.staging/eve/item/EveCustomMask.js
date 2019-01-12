import {quat, vec3, vec4} from "../../../global";
import {Tw2BaseClass} from "../../../global";

/**
 * EveCustomMask
 *
 * @property {Number} materialIndex -
 * @property {vec3} position        -
 * @property {quat} rotation        -
 * @property {vec3} scaling         -
 * @property {vec4} targetMaterials -
 */
export default class EveCustomMask extends Tw2BaseClass
{

    materialIndex = 0;
    position = vec3.create();
    rotation = quat.create();
    scaling = vec3.fromValues(1, 1, 1);
    targetMaterials = vec4.create();

}

Tw2BaseClass.define(EveCustomMask, Type =>
{
    return {
        isStaging: true,
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

