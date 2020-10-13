import { meta } from "global";


@meta.ctor("EveSOFDataMaterial")
export class EveSOFDataMaterial
{

    @meta.string
    name = "";

    @meta.list("EveSOFDataParameter")
    parameters = [];

    /**
     *
     * @param {Object} [out={}]
     * @param {String} [prefix]
     */
    AssignParameters(out = {}, prefix)
    {
        for (let i = 0; i < this.parameters.length; i++)
        {
            this.parameters[i].Assign(out, prefix);
        }
        return out;
    }

}
