import {Tw2StagingClass} from "../../class";

/**
 * EveLineContainer
 * @implements EveObject
 *
 * @parameter {EveCurveLineSet} lineSet -
 */
export default class EveLineContainer extends Tw2StagingClass
{

    lineSet = null;

}

Tw2StagingClass.define(EveLineContainer, Type =>
{
    return {
        type: "EveLineContainer",
        category: "EveObject",
        props: {
            lineSet: ["EveCurveLineSet"]
        }
    };
});

