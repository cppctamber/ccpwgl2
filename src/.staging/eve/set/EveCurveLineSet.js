import {Tw2BaseClass} from "../../class";

/**
 * EveCurveLineSet
 * @implements EveObjectSet
 *
 * @parameter {Tr2Effect} lineEffect -
 * @parameter {Tr2Effect} pickEffect -
 */
export default class EveCurveLineSet extends Tw2BaseClass
{

    lineEffect = null;
    pickEffect = null;

}

Tw2BaseClass.define(EveCurveLineSet, Type =>
{
    return {
        isStaging: true,
        type: "EveCurveLineSet",
        category: "EveObjectSet",
        props: {
            lineEffect: ["Tr2Effect"],
            pickEffect: ["Tr2Effect"]
        }
    };
});

