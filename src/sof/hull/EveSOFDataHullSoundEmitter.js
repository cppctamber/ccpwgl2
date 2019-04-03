/**
 * EveSOFDataHullSoundEmitter
 *
 * @property {String} name   -
 * @property {String} prefix -
 */
export class EveSOFDataHullSoundEmitter
{

    name = "";
    prefix = "";

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            ["name", r.string],
            ["prefix", r.string]
        ];
    }
}