/**
 * EveSOFDataHullController
 *
 * @property {String} path -
 */
export class EveSOFDataHullController
{

    path = "";

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            ["path", r.path],
        ];
    }
}