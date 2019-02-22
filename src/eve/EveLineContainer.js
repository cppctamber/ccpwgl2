import {Tw2BaseClass} from "../global";

/**
 * EveLineContainer
 * @ccp EveLineContainer
 * TODO: Implement
 *
 * @property {EveCurveLineSet} lineSet -
 */
export class EveLineContainer extends Tw2BaseClass
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
        },
        notImplemented: ["*"]
    };
});

