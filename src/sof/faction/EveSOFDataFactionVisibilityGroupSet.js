/**
 * EveSOFDataFactionVisibilityGroupSet
 *
 * @property {Array.<EveSOFDataGenericString>} visibilityGroups -
 */
export class EveSOFDataFactionVisibilityGroupSet
{

    visibilityGroups = [];

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            [ "visibilityGroups", r.array ],
        ];
    }
}
