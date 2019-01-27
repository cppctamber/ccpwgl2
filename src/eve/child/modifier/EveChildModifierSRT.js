import {quat, vec3, Tw2BaseClass} from "../../../global";

/**
 * EveChildModifierSRT
 * @implements ChildModifier
 *
 * @property {quat} rotation -
 * @property {vec3} scaling  -
 */
export class EveChildModifierSRT extends Tw2BaseClass
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

