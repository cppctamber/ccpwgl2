import {Tw2BaseClass} from "../../../global";

/**
 * EveChildModifierCameraOrientedRotationConstrained
 * @implements ChildModifier
 *
 */
export class EveChildModifierCameraOrientedRotationConstrained extends Tw2BaseClass
{


}

Tw2BaseClass.define(EveChildModifierCameraOrientedRotationConstrained, Type =>
{
    return {
        isStaging: true,
        type: "EveChildModifierCameraOrientedRotationConstrained",
        category: "ChildModifier",
        props: {}
    };
});

