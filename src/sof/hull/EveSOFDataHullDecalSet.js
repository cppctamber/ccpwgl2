/**
 * EveSOFDataHullDecalSet
 * @ccp EveSOFDataHullDecalSet
 *
 * @property {String} name
 * @property {Array<EveSOFDataHullDecalSetItem>} items
 * @property {String} visibilityGroup
 */
export class EveSOFDataHullDecalSet
{

    name = "";
    items = [];
    visibilityGroup = "";

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            ["name", r.string],
            ["items", r.array],
            ["visibilityGroup", r.string]
        ];
    }
}