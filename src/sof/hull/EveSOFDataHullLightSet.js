/**
 * EveSOFDataHullLightSet
 * @ccp EveSOFDataHullLightSet
 *
 * @property {String} name
 * @property {Array<EveSOFDataHullLightSetItem>} items
 */
export class EveSOFDataHullLightSet
{

    name = "";
    items = [];

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
        ];
    }
}