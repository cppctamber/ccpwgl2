import {Tw2StagingClass} from "../../class";

/**
 * EveCurveLineSet
 * @implements EveObjectSet
 *
 * @parameter {Tw2Effect} lineEffect -
 * @parameter {Tw2Effect} pickEffect -
 */
export default class EveCurveLineSet extends Tw2StagingClass
{

    lineEffect = null;
    pickEffect = null;

}

Tw2StagingClass.define(EveCurveLineSet, Type =>
{
    return {
        type: "EveCurveLineSet",
        category: "EveObjectSet",
        props: {
            lineEffect: ["Tw2Effect"],
            pickEffect: ["Tw2Effect"]
        }
    };
});

