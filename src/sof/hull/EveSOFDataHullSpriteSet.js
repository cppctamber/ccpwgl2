/**
 * EveSOFDataHullSpriteSet
 *
 * @property {String} name                               -
 * @property {Array.<EveSOFDataHullSpriteSetItem>} items -
 * @property {Boolean} skinned                           -
 * @property {String} visibilityGroup                    -
 */
export class EveSOFDataHullSpriteSet
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
            ["name", r.string],
            ["items", r.array],
            ["skinned", r.boolean],
            ["visibilityGroup", r.string]
        ];
    }
}