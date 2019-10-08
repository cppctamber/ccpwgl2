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
     * Assigns the texture's values to an object
     * @param {{}} [out={}]
     * @returns {{}}
     */
    Assign(out = {})
    {
        out[this.name] = this.resFilePath;
        return out;
    }

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            [ "name", r.string ],
            [ "resFilePath", r.path ]
        ];
    }
}
