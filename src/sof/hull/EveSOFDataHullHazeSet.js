/**
 * EveSOFDataHullHazeSet
 *
 * @property {String} name                             -
 * @property {Array.<EveSOFDataHullHazeSetItem>} items -
 * @property {Number} visibilityGroup                  -
 */
export class EveSOFDataHullHazeSet
{

    name = "";
    items = [];
    visibilityGroup = 0;

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
            ["visibilityGroup", r.string]
        ];
    }
}