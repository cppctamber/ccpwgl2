import {Tw2StagingClass} from "../../class";

/**
 * EveSOFDataPattern
 *
 * @parameter {EveSOFDataPatternLayer} layer1                -
 * @parameter {EveSOFDataPatternLayer} layer2                -
 * @parameter {Array.<EveSOFDataPatternPerHull>} projections -
 */
export default class EveSOFDataPattern extends Tw2StagingClass
{

    layer1 = null;
    layer2 = null;
    projections = [];

}

Tw2StagingClass.define(EveSOFDataPattern, Type =>
{
    return {
        type: "EveSOFDataPattern",
        props: {
            layer1: ["EveSOFDataPatternLayer"],
            layer2: ["EveSOFDataPatternLayer"],
            projections: [["EveSOFDataPatternPerHull"]]
        }
    };
});

