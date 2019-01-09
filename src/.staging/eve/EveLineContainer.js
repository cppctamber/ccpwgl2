import {Tw2BaseClass} from "../class";

/**
 * EveLineContainer
 * @implements EveObject
 *
 * @parameter {EveCurveLineSet} lineSet -
 */
export default class EveLineContainer extends Tw2BaseClass
{

    lineSet = null;

}

Tw2BaseClass.define(EveLineContainer, Type =>
{
    return {
        isStaging: true,
        type: "EveLineContainer",
        category: "EveObject",
        props: {
            lineSet: ["EveCurveLineSet"]
        }
    };
});

