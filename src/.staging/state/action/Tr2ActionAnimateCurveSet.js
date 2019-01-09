import {Tw2BaseClass} from "../../class";

/**
 * Tr2ActionAnimateCurveSet
 * @implements StateAction
 *
 * @parameter {TriCurveSet} curveSet -
 * @parameter {String} value         -
 */
export default class Tr2ActionAnimateCurveSet extends Tw2BaseClass
{

    curveSet = null;
    value = "";

}

Tw2BaseClass.define(Tr2ActionAnimateCurveSet, Type =>
{
    return {
        isStaging: true,
        type: "Tr2ActionAnimateCurveSet",
        category: "StateAction",
        props: {
            curveSet: ["TriCurveSet"],
            value: Type.STRING
        }
    };
});

