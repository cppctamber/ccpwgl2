/**
 * EveSOFDataMaterial
 *
 * @property {String} name                            -
 * @property {Array.<EveSOFDataParameter>} parameters -
 */
export class EveSOFDataMaterial
{

    name = "";
    parameters = [];

    /**
     * Black definition
     * @param {*} r
     * @returns {*[]}
     */
    static black(r)
    {
        return [
            ["name", r.string],
            ["parameters", r.array]
        ];
    }
}