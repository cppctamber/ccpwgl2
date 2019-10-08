/**
 * EveSOFDataGenericString
 *
 * @property {String} str -
 */
export class EveSOFDataGenericString
{

    str = "";

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            [ "str", r.string ],
        ];
    }
}
