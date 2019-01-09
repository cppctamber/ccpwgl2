import {Tw2BaseClass} from "../../class";

/**
 * EveChildModifierAttachToBone
 * @implements ChildModifier
 *
 * @parameter {Number} boneIndex -
 */
export default class EveChildModifierAttachToBone extends Tw2BaseClass
{

    boneIndex = 0;

}

Tw2BaseClass.define(EveChildModifierAttachToBone, Type =>
{
    return {
        isStaging: true,
        type: "EveChildModifierAttachToBone",
        category: "ChildModifier",
        props: {
            boneIndex: Type.NUMBER
        }
    };
});

