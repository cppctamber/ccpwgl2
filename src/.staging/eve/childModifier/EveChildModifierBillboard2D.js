import {Tw2BaseClass} from "../../../global";

/**
 * EveChildModifierBillboard2D
 * @implements ChildModifier
 *
 */
export default class EveChildModifierBillboard2D extends Tw2BaseClass
{


}

Tw2BaseClass.define(EveChildModifierBillboard2D, Type =>
{
    return {
        isStaging: true,
        type: "EveChildModifierBillboard2D",
        category: "ChildModifier",
        props: {}
    };
});

