import {Tw2BaseClass} from "../../class";

/**
 * Tr2IntSkinnedObject
 *
 * @parameter {Array.<TriCurveSet>} curveSets -
 * @parameter {TriMatrix} transform           -
 * @parameter {Tr2SkinnedModel} visualModel   -
 */
export default class Tr2IntSkinnedObject extends Tw2BaseClass
{

    curveSets = [];
    transform = null;
    visualModel = null;

}

Tw2BaseClass.define(Tr2IntSkinnedObject, Type =>
{
    return {
        isStaging: true,
        type: "Tr2IntSkinnedObject",
        props: {
            curveSets: [["TriCurveSet"]],
            transform: ["TriMatrix"],
            visualModel: ["Tr2SkinnedModel"]
        }
    };
});

