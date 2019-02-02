import {Tw2BaseClass} from "../../global";

/**
 * Tr2IntSkinnedObject
 * TODO: Do we need this class?
 * TODO: Implement
 *
 * @property {Array.<TriCurveSet>} curveSets -
 * @property {TriMatrix} transform           -
 * @property {Tr2SkinnedModel} visualModel   -
 */
export class Tr2IntSkinnedObject extends Tw2BaseClass
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
        },
        notImplemented: [
            "curveSets",
            "transform",
            "visualModel"
        ]
    };
});

