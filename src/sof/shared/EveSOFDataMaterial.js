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
     * Assigns the material to a simple plain object
     * @param {*} [out={}]
     * @param {String} [prefix]
     * @returns {{ name: String, parameters: Object}} out
     */
    Assign(out={}, prefix)
    {
        out.name = this.name;
        out.parameters = this.AssignParameters(out.parameters, prefix);
        return out;
    }

    /**
     * Assigns the material's parameters to a simple plain object
     * @param {{}} [out={}]
     * @param {String} [prefix]
     * @returns {Object} out
     */
    AssignParameters(out={}, prefix)
    {
        this.parameters.forEach(parameter => parameter.Assign(out, prefix));
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
            ["name", r.string],
            ["parameters", r.array]
        ];
    }
}