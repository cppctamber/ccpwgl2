import {Tw2BaseClass} from "../../../global";

/**
 * EveCurveLineSet
 * @implements EveObjectSet
 *
 * @property {Tr2Effect} lineEffect -
 * @property {Tr2Effect} pickEffect -
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

