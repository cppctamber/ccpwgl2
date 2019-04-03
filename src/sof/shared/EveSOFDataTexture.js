/**
 * EveSOFDataTexture
 *
 * @property {String} name        -
 * @property {String} resFilePath -
 */
export class EveSOFDataTexture
{

    name = "";
    resFilePath = "";

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            ["name", r.string],
            ["resFilePath", r.path]
        ];
    }
}