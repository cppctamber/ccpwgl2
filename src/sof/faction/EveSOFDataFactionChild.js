/**
 * EveSOFDataFactionChild
 *
 * @property {String} name
 * @property {Number} groupIndex -
 * @property {Boolean} isVisible -
 */
export class EveSOFDataFactionChild
{

    name = "";
    groupIndex = -1;
    isVisible = false;

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            ["groupIndex", r.uint],
            ["name", r.string],
            ["isVisible", r.boolean]
        ];
    }
}