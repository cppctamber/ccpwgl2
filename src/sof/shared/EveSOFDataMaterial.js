import { meta } from "global";


@meta.type("EveSOFDataMaterial", true)
export class EveSOFDataMaterial
{

    @meta.black.string
    name = "";

    @meta.black.listOf("EveSOFDataParameter")
    parameters = [];


    /**
     * Assigns the material to a simple plain object
     * @param {*} [out={}]
     * @param {String} [prefix]
     * @returns {{ name: String, parameters: Object}} out
     */
    Assign(out = {}, prefix)
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
    AssignParameters(out = {}, prefix)
    {
        this.parameters.forEach(parameter => parameter.Assign(out, prefix));
        return out;
    }

}
