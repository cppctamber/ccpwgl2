import {Tw2StagingClass} from "../../class";

/**
 * EveChildModifierAttachToBone
 * @implements ChildModifier
 *
 * @parameter {Number} boneIndex -
 */
export default class EveChildModifierAttachToBone extends Tw2StagingClass
{

    boneIndex = 0;

}

Tw2StagingClass.define(EveChildModifierAttachToBone, Type =>
{
    return {
        type: "EveChildModifierAttachToBone",
        category: "ChildModifier",
        props: {
            boneIndex: Type.NUMBER
        }
    };
});

