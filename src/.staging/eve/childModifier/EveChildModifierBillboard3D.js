import {Tw2BaseClass} from "../../../global";

/**
 * EveChildModifierBillboard3D
 * @implements ChildModifier
 *
 */
export default class EveChildModifierBillboard3D extends Tw2BaseClass
{


}

Tw2BaseClass.define(EveChildModifierBillboard3D, Type =>
{
    return {
        isStaging: true,
        type: "EveChildModifierBillboard3D",
        category: "ChildModifier",
        props: {}
    };
});

