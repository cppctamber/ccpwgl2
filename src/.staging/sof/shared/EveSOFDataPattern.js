import {Tw2BaseClass} from "../../class";

/**
 * EveSOFDataPattern
 *
 * @parameter {EveSOFDataPatternLayer} layer1                -
 * @parameter {EveSOFDataPatternLayer} layer2                -
 * @parameter {Array.<EveSOFDataPatternPerHull>} projections -
 */
export default class EveSOFDataPattern extends Tw2BaseClass
{

    layer1 = null;
    layer2 = null;
    projections = [];

}

Tw2BaseClass.define(EveSOFDataPattern, Type =>
{
    return {
        isStaging: true,
        type: "EveSOFDataPattern",
        props: {
            layer1: ["EveSOFDataPatternLayer"],
            layer2: ["EveSOFDataPatternLayer"],
            projections: [["EveSOFDataPatternPerHull"]]
        }
    };
});

