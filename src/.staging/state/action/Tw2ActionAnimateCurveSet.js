import {Tw2StagingClass} from "../../class";

/**
 * Tw2ActionAnimateCurveSet
 * @ccp Tr2ActionAnimateCurveSet
 * @implements StateAction
 *
 * @parameter {Tw2CurveSet} curveSet -
 * @parameter {String} value         -
 */
export default class Tw2ActionAnimateCurveSet extends Tw2StagingClass
{

    curveSet = null;
    value = "";

}

Tw2StagingClass.define(Tw2ActionAnimateCurveSet, Type =>
{
    return {
        type: "Tw2ActionAnimateCurveSet",
        category: "StateAction",
        props: {
            curveSet: ["Tw2CurveSet"],
            value: Type.STRING
        }
    };
});

