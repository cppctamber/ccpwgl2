import {Tw2BaseClass} from "../../global";

/**
 * Tr2ActionAnimateCurveSet
 * @implements StateAction
 * TODO: Implement
 *
 * @property {TriCurveSet} curveSet -
 * @property {String} value         -
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
        },
        notImplemented: [
            "curveSet",
            "value"
        ]
    };
});

