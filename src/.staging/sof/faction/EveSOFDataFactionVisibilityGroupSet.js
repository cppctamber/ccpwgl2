import {Tw2StagingClass} from "../../class";

/**
 * EveSOFDataFactionVisibilityGroupSet
 *
 * @parameter {Array.<EveSOFDataGenericString>} visibilityGroups -
 */
export default class EveSOFDataFactionVisibilityGroupSet extends Tw2StagingClass
{

    visibilityGroups = [];

}

Tw2StagingClass.define(EveSOFDataFactionVisibilityGroupSet, Type =>
{
    return {
        type: "EveSOFDataFactionVisibilityGroupSet",
        props: {
            visibilityGroups: [["EveSOFDataGenericString"]]
        }
    };
});

