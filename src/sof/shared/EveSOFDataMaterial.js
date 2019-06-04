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
     * Gets a simple object containing the material's data
     * @returns {*}
     */
    GetPlain()
    {
        const parameters = {};
        this.parameters.forEach(parameter =>
        {
            parameters[parameter.name] = Array.from(parameter.value);
        });
        return { name: this.name, parameters };
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