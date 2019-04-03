/**
 * EveSOFDataHullSpriteLineSet
 *
 * @property {String} name                                   -
 * @property {Array.<EveSOFDataHullSpriteLineSetItem>} items -
 * @property {Boolean} skinned                               -
 * @property {String} visibilityGroup                        -
 */
export class EveSOFDataHullSpriteLineSet
{

    name = "";
    items = [];
    skinned = false;
    visibilityGroup = "";

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            ["items", r.array],
            ["name", r.string],
            ["skinned", r.boolean],
            ["visibilityGroup", r.string]
        ];
    }
}