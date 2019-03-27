import {EveSOFBaseClass} from "../EveSOFBaseClass";

/**
 * EveSOFDataFactionVisibilityGroupSet
 *
 * @property {Array.<EveSOFDataGenericString>} visibilityGroups -
 */
export class EveSOFDataFactionVisibilityGroupSet extends EveSOFBaseClass
{

    visibilityGroups = [];

}

EveSOFDataFactionVisibilityGroupSet.define(r =>
{
    return {
        type: "EveSOFDataFactionVisibilityGroupSet",
        black: [
            ["visibilityGroups", r.array],
        ]
    };
});