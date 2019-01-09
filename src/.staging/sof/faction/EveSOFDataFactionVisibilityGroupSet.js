import {Tw2BaseClass} from "../../class";

/**
 * EveSOFDataFactionVisibilityGroupSet
 *
 * @parameter {Array.<EveSOFDataGenericString>} visibilityGroups -
 */
export default class EveSOFDataFactionVisibilityGroupSet extends Tw2BaseClass
{

    visibilityGroups = [];

}

Tw2BaseClass.define(EveSOFDataFactionVisibilityGroupSet, Type =>
{
    return {
        isStaging: true,
        type: "EveSOFDataFactionVisibilityGroupSet",
        props: {
            visibilityGroups: [["EveSOFDataGenericString"]]
        }
    };
});

