/**
 * EveSOFDataHullLocatorSet
 *
 * @property {String} name                          -
 * @property {Array.<EveSOFDataTransform>} locators -
 */
export class EveSOFDataHullLocatorSet
{

    name = "";
    locators = [];

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            ["name", r.string],
            ["locators", r.array]
        ];
    }
}