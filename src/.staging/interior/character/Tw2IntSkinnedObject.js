import {Tw2StagingClass} from "../../class";

/**
 * Tw2IntSkinnedObject
 * @ccp Tr2IntSkinnedObject
 *
 * @parameter {Array.<Tw2CurveSet>} curveSets -
 * @parameter {Tw2Matrix} transform           -
 * @parameter {Tw2SkinnedModel} visualModel   -
 */
export default class Tw2IntSkinnedObject extends Tw2StagingClass
{

    curveSets = [];
    transform = null;
    visualModel = null;

}

Tw2StagingClass.define(Tw2IntSkinnedObject, Type =>
{
    return {
        type: "Tw2IntSkinnedObject",
        props: {
            curveSets: [["Tw2CurveSet"]],
            transform: ["Tw2Matrix"],
            visualModel: ["Tw2SkinnedModel"]
        }
    };
});

