import {Tw2BaseClass} from "../../../global";

/**
 * EveChildModifierAttachToBone
 * @implements ChildModifier
 *
 * @property {Number} boneIndex -
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

