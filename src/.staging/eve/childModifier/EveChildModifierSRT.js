import {quat, vec3} from "../../../global";
import {Tw2BaseClass} from "../../class";

/**
 * EveChildModifierSRT
 * @implements ChildModifier
 *
 * @parameter {quat} rotation -
 * @parameter {vec3} scaling  -
 */
export default class EveChildModifierSRT extends Tw2BaseClass
{

    rotation = quat.create();
    scaling = vec3.fromValues(1, 1, 1);

}

Tw2BaseClass.define(EveChildModifierSRT, Type =>
{
    return {
        isStaging: true,
        type: "EveChildModifierSRT",
        category: "ChildModifier",
        props: {
            rotation: Type.TR_ROTATION,
            scaling: Type.TR_SCALING
        }
    };
});

